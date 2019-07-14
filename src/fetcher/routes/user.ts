import _ from 'lodash';
import pSeries from 'p-series';
import UserRequests from '../graphql/requests/user';
import { Month, allMonthNumbers } from '../../lib/date-utils';
import { GraphQLRequest } from '../graphql/utils';
import { Routefetcher } from './utils';
import {
    UserProfile,
    OrganizationProfileMinified,
    RepositoryProfileMinified,
    MonthlyContributions,
    ContributionsByRepository,
    MonthlyPullRequestContributions
} from '../../models';

/**
 * TODO: Add about about: 'Make requests for a single user or client ID serially. Do not make requests for a single user or client ID concurrently.' from https://developer.github.com/v3/guides/best-practices-for-integrators/
 */

export default class UserRoute extends Routefetcher {
    /**
     * Returns user profile.
     * Null is returned if user with given username was not found.
     *
     * @param username The GitHub username of the user
     */
    async getProfile(username: string): Promise<UserProfile | null> {
        const fetchedProfile = await this.fetcher.fetch<UserProfile>(new UserRequests.Profile(username));

        if (!fetchedProfile) return null;

        // Fetch info about organizations user is member of, and add result to profile
        const organizationMemberships = await this.getOrganizationMemberships(username);
        if (organizationMemberships) {
            fetchedProfile.organizationMemberships = organizationMemberships;
        }

        // Fetch info about public repositories that the user owns, and add result to profile
        const publicRepositoryOwnerships = await this.getPublicRepositoryOwnerships(username);
        if (publicRepositoryOwnerships) {
            fetchedProfile.publicRepositoryOwnerships = publicRepositoryOwnerships;
        }

        return fetchedProfile;
    }

    /**
     * Returns the organizations that the user is member of.
     * Null is returned if user with given username was not found.
     *
     * @param username The GitHub username of the user
     */
    async getOrganizationMemberships(username: string): Promise<OrganizationProfileMinified[] | null> {
        return await this.fetcher.pageFetch<OrganizationProfileMinified>(
            new UserRequests.OrganizationMemberships(username)
        );
    }

    /**
     * Returns public repositories that the user owns.
     * Null is returned if user with given username was not found.
     *
     * @param username The GitHub username of the user
     */
    async getPublicRepositoryOwnerships(username: string): Promise<RepositoryProfileMinified[] | null> {
        return await this.fetcher.pageFetch<RepositoryProfileMinified>(
            new UserRequests.PublicRespositoryOwnerships(username)
        );
    }

    /**
     * Returns all years that the user has contributed code in repositories on GitHub – e.g.
     * [2019, 2018, 2016, 2015, 2011].
     * Null is returned if user with given username was not found.
     *
     * @param username The GitHub username of the user
     */
    async getContributionYears(username: string): Promise<number[] | null> {
        return await this.fetcher.fetch<number[]>(new UserRequests.Contributions.ContributionYears(username));
    }

    /**
     * Returns all commit contributions from user for a specific month.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getCommitContributionsInMonth(
        username: string,
        inYear: number,
        inMonth: Month
    ): Promise<MonthlyContributions | null> {
        return await this.monthlyContributionsFetch(
            inMonth,
            new UserRequests.Contributions.CommitContributionsByRepository(username, inYear, inMonth)
        );
    }

    /**
     * Returns all commit contributions by year for user.
     * Null is returned if user with given username was not found.
     *
     * TODO: Slow performance comment
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getCommitContributionsInYear(username: string, inYear: number): Promise<MonthlyContributions[] | null> {
        // Partially applied function (missing month)
        return this.yearlyContributionsFetch(_.bind(this.getCommitContributionsInMonth, this, username, inYear));
    }

    /**
     * Returns all issue contributions from user for a specific month.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getIssueContributionsInMonth(
        username: string,
        inYear: number,
        inMonth: Month
    ): Promise<MonthlyContributions | null> {
        return await this.monthlyContributionsFetch(
            inMonth,
            new UserRequests.Contributions.IssueContributionsByRepository(username, inYear, inMonth)
        );
    }

    /**
     * Returns all issue contributions from user for a specific year.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getIssueContributionsInYear(username: string, year: number): Promise<MonthlyContributions[] | null> {
        // Partially applied function (missing month)
        return this.yearlyContributionsFetch(_.bind(this.getIssueContributionsInMonth, this, username, year));
    }

    /**
     * Returns all pull request reviews contributions from user in a specific month.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getPullRequestReviewContributionsInMonth(
        username: string,
        inYear: number,
        inMonth: Month
    ): Promise<MonthlyContributions | null> {
        return await this.monthlyContributionsFetch(
            inMonth,
            new UserRequests.Contributions.PullRequestReviewContributionsByRepository(username, inYear, inMonth)
        );
    }

    /**
     * Returns all pull request reviews contributions from user for a specific year.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getPullRequestReviewContributionsInYear(
        username: string,
        inYear: number
    ): Promise<MonthlyContributions[] | null> {
        // Partially applied function (missing month)
        return this.yearlyContributionsFetch(
            _.bind(this.getPullRequestReviewContributionsInMonth, this, username, inYear)
        );
    }

    /**
     * Returns all pull request contributions from user in a specific month.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getPullRequestContributionsInMonth(
        username: string,
        inYear: number,
        inMonth: Month
    ): Promise<MonthlyPullRequestContributions | null> {
        return await this.fetcher.fetch<MonthlyPullRequestContributions>(
            new UserRequests.Contributions.PullRequestContributionsByRepository(username, inYear, inMonth)
        );
    }

    /**
     * Returns all pull request contributions from user for a specific year.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getPullRequestContributionsInYear(
        username: string,
        inYear: number
    ): Promise<MonthlyPullRequestContributions[] | null> {
        const monthlyContributionMap = allMonthNumbers.map(
            (monthNumber: number): (() => Promise<MonthlyPullRequestContributions | null>) => {
                return (): Promise<MonthlyPullRequestContributions | null> => {
                    return this.getPullRequestContributionsInMonth(username, inYear, monthNumber);
                };
            }
        );
        /*
         * Runs promise operations serially to avoid triggering abuse mechanism. This results in slower performance,
         * but avoids failures.
         */
        const yearlyContributions = await pSeries(monthlyContributionMap);

        // No contributions found for username, thus return null
        if (_.some(yearlyContributions, (contribution): boolean => _.isNull(contribution))) return null;

        return yearlyContributions as MonthlyPullRequestContributions[];
    }

    // TODO: Comment
    private async monthlyContributionsFetch(
        inMonth: Month,
        request: GraphQLRequest<ContributionsByRepository[] | null>
    ): Promise<MonthlyContributions | null> {
        const contributions = await this.fetcher.fetch(request);
        if (!contributions) return null;

        return UserRoute.categorizeContributions(inMonth, contributions);
    }

    // TODO: Comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async yearlyContributionsFetch(contributionsRequest: any): Promise<MonthlyContributions[] | null> {
        const monthlyContributionMap = allMonthNumbers.map(
            (monthNumber: number): (() => Promise<MonthlyContributions | null>) => {
                return (): Promise<MonthlyContributions | null> => {
                    return contributionsRequest(monthNumber) as Promise<MonthlyContributions | null>;
                };
            }
        );
        /*
         * Runs promise operations serially to avoid triggering abuse mechanism. This results in slower performance,
         * but avoids failures.
         */
        const yearlyContributions = await pSeries(monthlyContributionMap);

        // No contributions found for username, thus return null
        if (_.some(yearlyContributions, (contribution): boolean => _.isNull(contribution))) return null;

        return yearlyContributions as MonthlyContributions[];
    }

    /**
     * Categorizes monthly contributions in public and private contributions
     *
     * @param allContributions List of all contributions
     */
    private static categorizeContributions(
        inMonth: Month,
        allContributions: ContributionsByRepository[]
    ): MonthlyContributions {
        // Filter out contributions in private repositories
        const publicContributions = _.filter(allContributions, (contribution): boolean => {
            return !contribution.repository.isPrivate;
        });
        // Gather count of contributions in private repositories
        const privateContributionsCount = _.reduce(
            allContributions,
            (acc: number, curValue: ContributionsByRepository): number => {
                return acc + (curValue.repository.isPrivate ? curValue.count : 0);
            },
            0
        );

        return {
            month: Month[inMonth],
            privateContributionsCount,
            publicContributions: publicContributions ? publicContributions : []
        };
    }
}
