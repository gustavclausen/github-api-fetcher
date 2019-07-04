import { Routefetcher } from './utils';
import { OrganizationProfile } from '../../models';
import GetOrganizationProfileRequest from '../graphql/requests/organization/profile';

export default class OrganizationRoute extends Routefetcher {
    async getProfile(organizationName: string): Promise<OrganizationProfile | null> {
        return await this.fetcher.fetch<OrganizationProfile>(new GetOrganizationProfileRequest(organizationName));
    }
}
