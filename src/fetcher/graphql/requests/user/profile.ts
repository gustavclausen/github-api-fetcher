import _ from 'lodash';
import { Expose, Transform, plainToClass } from 'class-transformer';
import { UserProfile, OrganizationProfileMinified, RepositoryProfileMinified } from '../../../../models';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_OBJECT_NAMES } from '../../common/fragments';
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
    @Transform((obj): object => obj['count'])
    followersCount!: number;
    organizationMemberships!: OrganizationProfileMinified[];
    repositoryOwnerships!: RepositoryProfileMinified[];
}

const profileFragment = new GraphQLFragment('UserProfile', GITHUB_OBJECT_NAMES.User, [
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
    fragment = profileFragment;
    query = `
        query GetUserProfileByUsername($username: String!) {
            user(login: $username) {
                ...${this.fragment.name}
            }
        }

        ${this.fragment}
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
