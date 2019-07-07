import { Routefetcher } from './utils';
import { OrganizationProfile } from '../../models';
import GetOrganizationProfileRequest from '../graphql/requests/organization/profile';

export default class OrganizationRoute extends Routefetcher {
    /**
     * Returns organization profile.
     * Null is returned if organization with given name was not found.
     *
     * Example: getProfile('facebook')
     *
     * @param organizationName GitHub name of organization (e.g. 'facebook')
     */
    async getProfile(organizationName: string): Promise<OrganizationProfile | null> {
        return await this.fetcher.fetch<OrganizationProfile>(new GetOrganizationProfileRequest(organizationName));
    }
}
