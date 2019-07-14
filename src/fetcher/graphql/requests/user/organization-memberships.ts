import { Expose, plainToClass } from 'class-transformer';
import { OrganizationProfileMinified } from '../../../../models';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { GraphQLPagedRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import fragments, { GITHUB_GRAPHQL_OBJECT_NAMES } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';

class MinOrganizationProfileParseModel implements OrganizationProfileMinified {
    @Expose()
    gitHubId!: string;

    @Expose()
    name!: string;

    @Expose()
    publicUrl!: string;
}

const fragment = new GraphQLFragment('MinOrganizationProfile', GITHUB_GRAPHQL_OBJECT_NAMES.Organization, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('login', 'name'),
    new GraphQLObjectField('url', 'publicUrl')
]);

export default class GetUserOrganizationMembershipsRequest extends GraphQLPagedRequest<OrganizationProfileMinified> {
    query = `
        query GetUserBelongingOrganizations($name: String!, $after: String) {
            user(login: $name) {
                organizations(first: 100, after: $after) {
                    nodes {
                        ...${fragment.name}
                    }
                    pageInfo {
                        ...${fragments.pageInfo.name}
                    }
                }
            }
        }

        ${fragment}
        ${fragments.pageInfo}
    `;

    constructor(name: string) {
        super({ name: name });
    }

    parseResponse(rawData: object): OrganizationProfileMinified[] {
        super.parseResponse(rawData); // Essential – updates page-info with data from response object

        const results = getValueForFirstKey(rawData, 'nodes') as object;
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse and returns each element in response data on current page
        return Object.values(results).map(
            (curValue): OrganizationProfileMinified => {
                return plainToClass(MinOrganizationProfileParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
