import requests from '../graphql/requests/unified';
import { Routefetcher } from './utils';
import { RepositoryProfile } from '../../models';

export default class RepositoryRoute extends Routefetcher {
    async getProfile(ownerUsername: string, repositoryName: string): Promise<RepositoryProfile | null> {
        return await this.fetcher.fetch<RepositoryProfile>(
            new requests.RepositoryProfile(ownerUsername, repositoryName)
        );
    }
}
