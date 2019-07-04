import { Routefetcher } from './utils';
import { RepositoryProfile } from '../../models';
import GetRepositoryProfileRequest from '../graphql/requests/repository/profile';

export default class RepositoryRoute extends Routefetcher {
    async getProfile(ownerUsername: string, repositoryName: string): Promise<RepositoryProfile | null> {
        return await this.fetcher.fetch<RepositoryProfile>(
            new GetRepositoryProfileRequest(ownerUsername, repositoryName)
        );
    }
}
