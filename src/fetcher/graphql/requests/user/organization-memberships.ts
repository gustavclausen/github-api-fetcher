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
import { ParseError } from '../../../../lib/errors';

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

        const results = getValueForFirstKey(rawData, 'nodes') as object;
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse each element in response data
        return Object.values(results).map(
            (curValue: object): OrganizationProfileMinified => {
                return plainToClass(MinOrganizationProfileParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
