import { Routefetcher } from './utils';
import { GistProfile } from '../../models';
import GistRequests from '../graphql/requests/gist';

export default class GistRoute extends Routefetcher {
    /**
     * Returns gist profile.
     * Null is returned if gist with given parameters was not found.
     *
     * Example: getGist('staltz', '868e7e9bc2a7b8c1f754')
     *
     * @param ownerUsername The GitHub username of the owner
     * @param gistName Name of the gist
     */
    async getProfile(ownerUsername: string, gistName: string): Promise<GistProfile | null> {
        return await this.fetcher.fetch<GistProfile>(new GistRequests.Profile(ownerUsername, gistName));
    }
}
