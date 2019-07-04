import requests from '../graphql/requests/unified';
import { Routefetcher } from './utils';
import { OrganizationProfile } from '../../models';

export default class OrganizationRoute extends Routefetcher {
    async getProfile(organizationName: string): Promise<OrganizationProfile | null> {
        return await this.fetcher.fetch<OrganizationProfile>(new requests.OrganizationProfile(organizationName));
    }
}
