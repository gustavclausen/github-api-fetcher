import { Routefetcher } from './utils';
import { UserProfile, OrganizationProfileMinified, RepositoryProfileMinified } from '../../models';
import GetUserProfileRequest from '../graphql/requests/user/profile';
import GetUserOrganizationMembershipsRequest from '../graphql/requests/user/organization-memberships';
import GetUserRepositoryOwnershipsRequest from '../graphql/requests/user/repository-ownerships';
import GetUserContributionYearsRequest from '../graphql/requests/user/contribution-years';

export default class UserRoute extends Routefetcher {
    async getProfile(username: string): Promise<UserProfile | null> {
        const fetchedProfile = await this.fetcher.fetch<UserProfile>(new GetUserProfileRequest(username));

        if (!fetchedProfile) return null;

        // Fetch info about organizations user is member of, and add result to profile
        const organizationMemberships = await this.getOrganizationMemberships(username);
        if (organizationMemberships) {
            fetchedProfile.organizationMemberships = organizationMemberships;
        }

        // Fetch info about repositories user owns, and add result to profile
        const repositoryOwnerships = await this.getRepositoryOwnerships(username);
        if (repositoryOwnerships) {
            fetchedProfile.repositoryOwnerships = repositoryOwnerships;
        }

        return fetchedProfile;
    }

    private async getOrganizationMemberships(username: string): Promise<OrganizationProfileMinified[] | null> {
        return await this.fetcher.pageFetch<OrganizationProfileMinified>(
            new GetUserOrganizationMembershipsRequest(username)
        );
    }

    private async getRepositoryOwnerships(username: string): Promise<RepositoryProfileMinified[] | null> {
        return await this.fetcher.pageFetch<RepositoryProfileMinified>(
            new GetUserRepositoryOwnershipsRequest(username)
        );
    }

    private async getContributionYears(username: string): Promise<number[] | null> {
        return await this.fetcher.fetch<number[]>(new GetUserContributionYearsRequest(username));
    }
}
