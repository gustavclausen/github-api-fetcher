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
    CommitContributionByRepository,
    YearlyCommitContribution
} from '../../models';

export default class UserRoute extends Routefetcher {
    /**
     * Returns user profile
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

    // TODO: Comment
    private async getYearlyCommitContributions(
        username: string,
        years: number[]
    ): Promise<YearlyCommitContribution[] | null> {
        return await Promise.all(
            _.map(
                years,
                async (year: number): Promise<YearlyCommitContribution> => {
                    const contributions = await this.fetcher.fetch<CommitContributionByRepository[]>(
                        new GetUserCommitContributionsByRepositoryRequest(username, year)
                    );
                    const publicContributions = _.filter(contributions, (contribution): boolean => {
                        return !contribution.repository.isPrivate;
                    });
                    const restrictedCommitCount = _.reduce(
                        contributions,
                        (acc: number, curValue): number => {
                            return acc + (curValue.repository.isPrivate ? curValue.commitCount : 0);
                        },
                        0
                    );

                    return {
                        year,
                        restrictedCommitCount,
                        publicContributions: publicContributions ? publicContributions : []
                    };
                }
            )
        );
    }

    /**
     * Returns the organizations that the user is member of
     * @param username The GitHub username of the user
     */
    private async getOrganizationMemberships(username: string): Promise<OrganizationProfileMinified[] | null> {
        return await this.fetcher.pageFetch<OrganizationProfileMinified>(
            new GetUserOrganizationMembershipsRequest(username)
        );
    }

    /**
     * Returns public repositories that the user owns
     * @param username The GitHub username of the user
     */
    private async getPublicRepositoryOwnerships(username: string): Promise<RepositoryProfileMinified[] | null> {
        return await this.fetcher.pageFetch<RepositoryProfileMinified>(
            new GetUserRepositoryOwnershipsRequest(username)
        );
    }

    /**
     * Returns all years that the user has contributed code in repositories on GitHub – e.g.
     * [2019, 2018, 2016, 2015, 2011]
     * @param username The GitHub username of the user
     */
    private async getContributionYears(username: string): Promise<number[] | null> {
        return await this.fetcher.fetch<number[]>(new GetUserContributionYearsRequest(username));
    }
}
