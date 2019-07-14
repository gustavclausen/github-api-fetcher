import Contributions from './user/contributions';
import GetUserOrganizationMembershipsRequest from './user/organization-memberships';
import GetUserProfileRequest from './user/profile';
import GetPublicUserRespositoryOwnershipsRequest from './user/repository-ownerships';

export default {
    Contributions,
    OrganizationMemberships: GetUserOrganizationMembershipsRequest,
    Profile: GetUserProfileRequest,
    PublicRespositoryOwnerships: GetPublicUserRespositoryOwnershipsRequest
};
