import _ from 'lodash';
import { Expose, Transform, plainToClass } from 'class-transformer';
import { OrganizationProfile } from '../../../../models';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_GRAPHQL_OBJECT_NAMES } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';

class OrganizationProfileParseModel implements OrganizationProfile {
    @Expose()
    gitHubId!: string;

    @Expose()
    name!: string;

    @Expose()
    displayName!: string;

    @Expose()
    description!: string;

    @Expose()
    avatarUrl!: string;

    @Expose()
    publicUrl!: string;

    @Expose()
    @Transform((obj): number => _.get(obj, 'count'))
    membersCount!: number;
}

const fragment = new GraphQLFragment('OrganizationProfile', GITHUB_GRAPHQL_OBJECT_NAMES.Organization, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('login', 'name'),
    new GraphQLObjectField('name', 'displayName'),
    new GraphQLObjectField('url', 'publicUrl'),
    new GraphQLObjectField('description'),
    new GraphQLObjectField('avatarUrl'),
    new GraphQLObjectField('membersWithRole', 'membersCount', [new GraphQLObjectField('totalCount', 'count')])
]);

export default class GetOrganizationProfileRequest implements GraphQLRequest<OrganizationProfile> {
    query = `
        query GetOrganizationProfile($name: String!) {
            organization(login: $name) {
                ...${fragment.name}
            }
        }

        ${fragment}
    `;
    variables: object | undefined;

    constructor(name: string) {
        this.variables = {
            name: name
        };
    }

    parseResponse(rawData: object): OrganizationProfile {
        const organizationProfileData = _.get(rawData, 'organization');
        if (!organizationProfileData) {
            throw new ParseError(rawData);
        }

        return plainToClass(OrganizationProfileParseModel, organizationProfileData, {
            excludeExtraneousValues: true
        });
    }
}
