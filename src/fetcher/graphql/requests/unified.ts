import GetUserProfileRequest from './user/profile';
import GetUserOrganizationMembershipsRequest from './user/organization-memberships';
import GetUserContributionYearsRequest from './user/contribution-years';
import GetUserRepositoryOwnerships from './user/repository-ownerships';
import GetOrganizationProfile from './organization/profile';
import GetRepositoryProfileRequest from './repository/profile';

export default {
    UserProfile: GetUserProfileRequest,
    UserOrganizationMemberships: GetUserOrganizationMembershipsRequest,
    UserContributionYears: GetUserContributionYearsRequest,
    UserRepositoryOwnerships: GetUserRepositoryOwnerships,
    OrganizationProfile: GetOrganizationProfile,
    RepositoryProfile: GetRepositoryProfileRequest
};
