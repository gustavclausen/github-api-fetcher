import Contributions from './user/contributions';
import GetUserOrganizationMembershipsRequest from './user/organization-memberships';
import GetUserProfileRequest from './user/profile';
import GetPublicUserRespositoryOwnershipsRequest from './user/repository-ownerships';
import GetPublicUserGistsRequest from './user/gists';

export default {
    Contributions,
    OrganizationMemberships: GetUserOrganizationMembershipsRequest,
    Profile: GetUserProfileRequest,
    PublicRespositoryOwnerships: GetPublicUserRespositoryOwnershipsRequest,
    PublicGists: GetPublicUserGistsRequest
};
