import _ from 'lodash';
import { Routefetcher } from './utils';
import GetUserProfileRequest from '../graphql/requests/user/profile';
import GetUserOrganizationMembershipsRequest from '../graphql/requests/user/organization-memberships';
import GetUserRepositoryOwnershipsRequest from '../graphql/requests/user/repository-ownerships';
import GetUserContributionYearsRequest from '../graphql/requests/user/contribution-years';
import GetUserCommitContributionsByRepositoryRequest from '../graphql/requests/user/commit-contribution-by-repository';
import {
    UserProfile,
    OrganizationProfileMinified,
    RepositoryProfileMinified,
    CommitContributionsByRepository,
    YearlyCommitContributions
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
     * Returns all commit contributions for user.
     * Null is returned if user with given username was not found.
     *
     * NOTE:
     * Might include contributions to private repositories depending on GitHub settings
     * (see: https://help.github.com/en/articles/publicizing-or-hiding-your-private-contributions-on-your-profile)
     * and access token scopes (see: https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)
     *
     * @param username The GitHub username of the user
     */
    async getAllCommitContributions(username: string): Promise<YearlyCommitContributions[] | null> {
        const contributionYears = await this.getContributionYears(username);
        if (!contributionYears) return null;

        // Collect commit contributions for each contribution year
        return await _.reduce(
            contributionYears,
            async (
                accum: Promise<YearlyCommitContributions[]>,
                contributionYear: number
            ): Promise<YearlyCommitContributions[]> => {
                const yearlyContributions = await this.getCommitContributionsByYear(username, contributionYear);
                if (!yearlyContributions) return accum;

                return Promise.resolve([...(await accum), yearlyContributions]);
            },
            Promise.resolve([] as YearlyCommitContributions[])
        );
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
    async getCommitContributionsByYear(username: string, year: number): Promise<YearlyCommitContributions | null> {
        const allContributions = await this.fetcher.fetch<CommitContributionsByRepository[]>(
            new GetUserCommitContributionsByRepositoryRequest(username, year)
        );
        if (!allContributions) return null; // User with given username was not found

        // Filter out contributions to private repositories
        const publicContributions = _.filter(allContributions, (contribution): boolean => {
            return !contribution.repository.isPrivate;
        });
        // Gather count of commits in private repositories
        const privateCommitCount = _.reduce(
            allContributions,
            (acc: number, curValue: CommitContributionsByRepository): number => {
                return acc + (curValue.repository.isPrivate ? curValue.commitCount : 0);
            },
            0
        );

        return {
            year,
            privateCommitCount,
            publicContributions: publicContributions ? publicContributions : []
        };
    }
}
