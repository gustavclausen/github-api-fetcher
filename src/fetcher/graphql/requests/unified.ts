import GetUserProfileRequest from './user/profile';
import GetUserOrganizationMembershipsRequest from './user/organization-memberships';
import GetOrganizationProfile from './organization/profile';
import GetUserRepositoryOwnerships from './user/repository-ownerships';
import GetRepositoryProfileRequest from './repository/profile';

export default {
    UserProfile: GetUserProfileRequest,
    UserOrganizationMemberships: GetUserOrganizationMembershipsRequest,
    OrganizationProfile: GetOrganizationProfile,
    UserRepositoryOwnerships: GetUserRepositoryOwnerships,
    RepositoryProfile: GetRepositoryProfileRequest
};
