import GetUserProfileRequest from './user/profile';
import GetUserOrganizationMembershipsRequest from './user/organization-memberships';
import GetOrganizationProfile from './organization/profile';

export default {
    UserProfile: GetUserProfileRequest,
    UserOrganizationMemberships: GetUserOrganizationMembershipsRequest,
    OrganizationProfile: GetOrganizationProfile
};
