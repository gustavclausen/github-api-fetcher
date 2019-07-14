import _ from 'lodash';
import { Expose, Transform, plainToClass } from 'class-transformer';
import { UserProfile, OrganizationProfileMinified, RepositoryProfileMinified } from '../../../../models';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_GRAPHQL_OBJECT_NAMES } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';

class UserProfileParseModel implements UserProfile {
    @Expose()
    gitHubId!: string;

    @Expose()
    username!: string;

    @Expose()
    displayName!: string;

    @Expose()
    company!: string;

    @Expose()
    publicUrl!: string;

    @Expose()
    creationDateTime!: Date;

    @Expose()
    avatarUrl!: string;

    @Expose()
    forHire!: boolean;

    @Expose()
    @Transform((obj): number => _.get(obj, 'count'))
    followersCount!: number;

    organizationMemberships!: OrganizationProfileMinified[]; // To be set later with data from another request

    publicRepositoryOwnerships!: RepositoryProfileMinified[]; // To be set later with data from another request
}

const fragment = new GraphQLFragment('UserProfile', GITHUB_GRAPHQL_OBJECT_NAMES.User, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('login', 'username'),
    new GraphQLObjectField('name', 'displayName'),
    new GraphQLObjectField('company'),
    new GraphQLObjectField('url', 'publicUrl'),
    new GraphQLObjectField('createdAt', 'creationDateTime'),
    new GraphQLObjectField('avatarUrl'),
    new GraphQLObjectField('isHireable', 'forHire'),
    new GraphQLObjectField('followers', 'followersCount', [new GraphQLObjectField('totalCount', 'count')])
]);

export default class GetUserProfileRequest implements GraphQLRequest<UserProfile> {
    query = `
        query GetUserProfile($username: String!) {
            user(login: $username) {
                ...${fragment.name}
            }
        }

        ${fragment}
    `;
    variables: object | undefined;

    constructor(username: string) {
        this.variables = {
            username: username
        };
    }

    parseResponse(rawData: object): UserProfile {
        const userProfileData = _.get(rawData, 'user');
        if (!userProfileData) {
            throw new ParseError(rawData);
        }

        return plainToClass(UserProfileParseModel, userProfileData, { excludeExtraneousValues: true });
    }
}
