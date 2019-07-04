import { Expose, plainToClass } from 'class-transformer';
import { OrganizationProfileMinified } from '../../../../models';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { AbstractPagedRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_GRAPHQL_OBJECT_NAMES, fragments } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';

class MinOrganizationProfileParseModel implements OrganizationProfileMinified {
    @Expose()
    gitHubId!: string;

    @Expose()
    name!: string;

    @Expose()
    publicUrl!: string;
}

const profileFragment = new GraphQLFragment('MinOrganizationProfile', GITHUB_GRAPHQL_OBJECT_NAMES.Organization, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('login', 'name'),
    new GraphQLObjectField('url', 'publicUrl')
]);

export default class GetUserOrganizationMembershipsRequest extends AbstractPagedRequest<OrganizationProfileMinified> {
    fragment = profileFragment;
    query = `
        query GetUserBelongingOrganizations($name: String!, $after: String) {
            user(login: $name) {
                organizations(first: 100, after: $after) {
                    nodes {
                        ...${this.fragment.name}
                    }
                    pageInfo {
                        ...${fragments.pageInfo.name}
                    }
                }
            }
        }

        ${this.fragment}
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
