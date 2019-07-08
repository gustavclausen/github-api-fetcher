import _ from 'lodash';
import APIFetcher from '../../main';
import { GraphQLRequest } from '../graphql/utils';
import { Routefetcher } from './utils';
import GetUserProfileRequest from '../graphql/requests/user/profile';
import GetUserOrganizationMembershipsRequest from '../graphql/requests/user/organization-memberships';
import GetUserRepositoryOwnershipsRequest from '../graphql/requests/user/repository-ownerships';
import GetUserContributionYearsRequest from '../graphql/requests/user/contributions/contribution-years';
import GetUserCommitContributionsByRepositoryRequest from '../graphql/requests/user/contributions/commit-contributions-by-repository';
import GetUserIssueContributionsByRepositoryRequest from '../graphql/requests/user/contributions/issue-contributions-by-repository';
import GetUserPullRequestReviewContributionsByRepositoryRequest from '../graphql/requests/user/contributions/pull-request-review-contributions-by-repository';
import GetUserPullRequestContributionsByRepositoryRequest from '../graphql/requests/user/contributions/pull-request-contributions-by-repository';
import {
    UserProfile,
    OrganizationProfileMinified,
    RepositoryProfileMinified,
    YearlyContributions,
    ContributionsByRepository,
    YearlyPullRequestContributions
} from '../../models';

export default class UserRoute extends Routefetcher {
    /**
     * Returns user profile.
     * Null is returned if user with given username was not found.
     *
     * @param username The GitHub username of the user
     */
    async getProfile(username: string): Promise<UserProfile | null> {
        const fetchedProfile = await this.fetcher.fetch<UserProfile>(new GetUserProfileRequest(username));

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
            new GetUserOrganizationMembershipsRequest(username)
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
            new GetUserRepositoryOwnershipsRequest(username)
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
        return await this.fetcher.fetch<number[]>(new GetUserContributionYearsRequest(username));
    }

    /**
     * Returns all commit contributions for every contribution year of user.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getAllCommitContributions(username: string): Promise<YearlyContributions[] | null> {
        return await this.contributionsFetchForAllYears(username, this.getCommitContributionsByYear, this.fetcher);
    }

    /**
     * Returns all commit contributions by year for user.
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
    async getCommitContributionsByYear(
        username: string,
        year: number,
        fetcher?: APIFetcher
    ): Promise<YearlyContributions | null> {
        return await UserRoute.contributionsFetch(
            year,
            new GetUserCommitContributionsByRepositoryRequest(username, year),
            this ? this.fetcher : fetcher ? fetcher : new APIFetcher()
        );
    }

    /**
     * Returns all issue contributions for every contribution year of user.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getAllIssueContributions(username: string): Promise<YearlyContributions[] | null> {
        return await this.contributionsFetchForAllYears(username, this.getIssueContributionsByYear, this.fetcher);
    }

    /**
     * Returns all issue contributions by year for user.
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
    async getIssueContributionsByYear(
        username: string,
        year: number,
        fetcher?: APIFetcher
    ): Promise<YearlyContributions | null> {
        return await UserRoute.contributionsFetch(
            year,
            new GetUserIssueContributionsByRepositoryRequest(username, year),
            this ? this.fetcher : fetcher ? fetcher : new APIFetcher()
        );
    }

    /**
     * Returns all pull request reviews contributions for every contribution year of user.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getAllPullRequestReviewContributions(username: string): Promise<YearlyContributions[] | null> {
        return await this.contributionsFetchForAllYears(
            username,
            this.getPullRequestReviewContributionsByYear,
            this.fetcher
        );
    }

    /**
     * Returns all pull request reviews contributions by year for user.
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
    async getPullRequestReviewContributionsByYear(
        username: string,
        year: number,
        fetcher?: APIFetcher
    ): Promise<YearlyContributions | null> {
        return await UserRoute.contributionsFetch(
            year,
            new GetUserPullRequestReviewContributionsByRepositoryRequest(username, year),
            this ? this.fetcher : fetcher ? fetcher : new APIFetcher()
        );
    }

    /**
     * Returns all pull request contributions by year for user.
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
    async getPullRequestContributionsByYear(
        username: string,
        year: number,
        fetcher?: APIFetcher
    ): Promise<YearlyPullRequestContributions | null> {
        return await this.fetcher.fetch<YearlyPullRequestContributions>(
            new GetUserPullRequestContributionsByRepositoryRequest(username, year)
        );
    }

    /**
     * Fetches contributions according to given GraphQL request
     *
     * @param year Calendar year to gather contributions from
     * @param contributionRequest GraphQL request specific to type of contribution
     * @param fetcher APIFetcher
     */
    private static async contributionsFetch(
        year: number,
        contributionRequest: GraphQLRequest<ContributionsByRepository[]>,
        fetcher: APIFetcher
    ): Promise<YearlyContributions | null> {
        const allContributions = await fetcher.fetch<ContributionsByRepository[]>(contributionRequest);
        if (!allContributions) return null; // User with given username was not found

        return UserRoute.formatContributionsOfYear(year, allContributions);
    }

    /**
     * Fetches contributions for each contribution year of user
     *
     * @param username The GitHub username of user
     * @param fetcher APIFetcher
     * @param fetchFunc Function that fetches specific type of contribution (commit, issue, PR etc.)
     */
    private async contributionsFetchForAllYears(
        username: string,
        fetchFunc: (username: string, year: number, fetcher?: APIFetcher) => Promise<YearlyContributions | null>,
        fetcher: APIFetcher
    ): Promise<YearlyContributions[] | null> {
        const contributionYears = await this.getContributionYears(username);
        if (!contributionYears) return null;

        return await _.reduce(
            contributionYears,
            async (accum: Promise<YearlyContributions[]>, contributionYear: number): Promise<YearlyContributions[]> => {
                const yearlyContributions = await fetchFunc(username, contributionYear, fetcher);
                if (!yearlyContributions) return accum;

                return Promise.resolve([...(await accum), yearlyContributions]);
            },
            Promise.resolve([] as YearlyContributions[])
        );
    }

    /**
     * Formats contributions in public and private contributions of year
     *
     * @param allContributions List of all contributions of year
     */
    private static formatContributionsOfYear(
        year: number,
        allContributions: ContributionsByRepository[]
    ): YearlyContributions {
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
            year,
            privateContributionsCount,
            publicContributions: publicContributions ? publicContributions : []
        };
    }
}
