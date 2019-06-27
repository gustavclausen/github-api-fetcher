import { Expose, plainToClass } from 'class-transformer';
import { OrganizationProfileMinified } from '../../../../models';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import {
    AbstractPagedRequest,
    GraphQLFragment,
    GraphQLObjectField,
    pageInfoFragment,
    GITHUB_OBJECT_NAMES
} from '../../utils';

class MinOrganizationProfileParseModel implements OrganizationProfileMinified {
    @Expose()
    gitHubId!: string;
    @Expose()
    name!: string;
}

const profileFragment = new GraphQLFragment('minOrganizationProfile', GITHUB_OBJECT_NAMES.Organization, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('login', 'name')
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
                        ...${pageInfoFragment.name}
                    }
                }
            }
        }

        ${this.fragment}
        ${pageInfoFragment}
    `;

    constructor(name: string) {
        super({ name: name });
    }

    /**
     * Returns elements on current page
     * @param rawData Raw JSON object to parse
     */
    parseResponse(rawData: object): OrganizationProfileMinified[] {
        super.parseResponse(rawData);

        // TODO: Add null check for nodes

        // Parse each element in response data
        return Object.values(getValueForFirstKey(rawData, 'nodes') as object).map(
            (curValue: object): OrganizationProfileMinified => {
                return plainToClass(MinOrganizationProfileParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
