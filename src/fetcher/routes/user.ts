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
    MonthlyPullRequestContributions,
    GistProfileMinified
} from '../../models';

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

        // Fetch info about public gists that the user created, and add result to profile
        const publicGists = await this.getPublicGists(username);
        if (publicGists) {
            fetchedProfile.publicGists = publicGists;
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
     * Returns public gists that the user has owns.
     * Null is returned if user with given username was not found.
     *
     * @param username The GitHub username of the user
     */
    async getPublicGists(username: string): Promise<GistProfileMinified[] | null> {
        return await this.fetcher.pageFetch<GistProfileMinified>(new UserRequests.PublicGists(username));
    }

    /**
     * Returns all years in which the user has contributed code in repositories on GitHub – e.g.
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
     *
     * NOTE:
     * - Might take several seconds to fetch data, as data has to be fetched serially month by month. This is due to
     *   GitHub's requirement of not making requests for a single user concurrently. This results in slower performance,
     *   but avoids failures.
     *   See: https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits
     *
     * - Might include contributions to private repositories depending on GitHub settings
     *   (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     *   and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getCommitContributionsInYear(username: string, inYear: number): Promise<MonthlyContributions[] | null> {
        // Partially applied function (waiting for month argument)
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
     * - Might take several seconds to fetch data, as data has to be fetched serially month by month. This is due to
     *   GitHub's requirement of not making requests for a single user concurrently. This results in slower performance,
     *   but avoids failures.
     *   See: https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits
     *
     * - Might include contributions to private repositories depending on GitHub settings
     *   (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     *   and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getIssueContributionsInYear(username: string, year: number): Promise<MonthlyContributions[] | null> {
        // Partially applied function (waiting for month argument)
        return this.yearlyContributionsFetch(_.bind(this.getIssueContributionsInMonth, this, username, year));
    }

    /**
     * Returns all pull request reviews contributions from user for a specific month.
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
     * - Might take several seconds to fetch data, as data has to be fetched serially month by month. This is due to
     *   GitHub's requirement of not making requests for a single user concurrently. This results in slower performance,
     *   but avoids failures.
     *   See: https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits
     *
     * - Might include contributions to private repositories depending on GitHub settings
     *   (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     *   and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getPullRequestReviewContributionsInYear(
        username: string,
        inYear: number
    ): Promise<MonthlyContributions[] | null> {
        // Partially applied function (waiting for month argument)
        return this.yearlyContributionsFetch(
            _.bind(this.getPullRequestReviewContributionsInMonth, this, username, inYear)
        );
    }

    /**
     * Returns all pull request contributions from user for a specific month.
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
     * - Might take several seconds to fetch data, as data has to be fetched serially month by month. This is due to
     *   GitHub's requirement of not making requests for a single user concurrently. This results in slower performance,
     *   but avoids failures.
     *   See: https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits
     *
     * - Might include contributions to private repositories depending on GitHub settings
     *   (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     *   and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     * @param year Calendar year to gather contributions from
     */
    async getPullRequestContributionsInYear(
        username: string,
        inYear: number
    ): Promise<MonthlyPullRequestContributions[] | null> {
        // Runs promise operations serially to avoid triggering abuse mechanism
        const monthlyContributionMap = allMonthNumbers.map(
            (monthNumber: number): (() => Promise<MonthlyPullRequestContributions | null>) => {
                return (): Promise<MonthlyPullRequestContributions | null> => {
                    return this.getPullRequestContributionsInMonth(username, inYear, monthNumber);
                };
            }
        );
        const yearlyContributions = await pSeries(monthlyContributionMap);

        // No contributions found for username, thus return null
        if (_.some(yearlyContributions, (contribution): boolean => _.isNull(contribution))) return null;

        return yearlyContributions as MonthlyPullRequestContributions[];
    }

    private async monthlyContributionsFetch(
        inMonth: Month,
        request: GraphQLRequest<ContributionsByRepository[] | null>
    ): Promise<MonthlyContributions | null> {
        const contributions = await this.fetcher.fetch(request);
        if (!contributions) return null;

        return UserRoute.categorizeContributions(inMonth, contributions);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async yearlyContributionsFetch(contributionsRequest: any): Promise<MonthlyContributions[] | null> {
        // Runs promise operations serially to avoid triggering abuse mechanism
        const monthlyContributionMap = allMonthNumbers.map(
            (monthNumber: number): (() => Promise<MonthlyContributions | null>) => {
                return (): Promise<MonthlyContributions | null> => {
                    return contributionsRequest(monthNumber) as Promise<MonthlyContributions | null>;
                };
            }
        );
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
