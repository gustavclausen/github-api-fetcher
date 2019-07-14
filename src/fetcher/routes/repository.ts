import { Routefetcher } from './utils';
import { RepositoryProfile } from '../../models';
import RepositoryRequests from '../graphql/requests/repository';

export default class RepositoryRoute extends Routefetcher {
    /**
     * Returns repository profile.
     * Null is returned if repository with given parameters was not found.
     *
     * Example #1 (user-owned repository): getProfile('torvalds', 'linux')
     *
     * Example #2 (organization-owned repository): getProfile('facebook', 'react')
     *
     * @param ownerUsername The GitHub name of the repository owner (i.e. the username if the owner is a user,
     * or the name of a organization if the owner is a organization)
     * @param repositoryName The GitHub name of the repository (e.g. 'linux' or 'facebook')
     */
    async getProfile(ownerUsername: string, repositoryName: string): Promise<RepositoryProfile | null> {
        return await this.fetcher.fetch<RepositoryProfile>(
            new RepositoryRequests.Profile(ownerUsername, repositoryName)
        );
    }
}
