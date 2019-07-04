import { plainToClass } from 'class-transformer';
import { OrganizationProfileMinified, RepositoryProfileMinified } from '../../../../models';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { GraphQLPagedRequest } from '../../utils';
import { ParseError } from '../../../../lib/errors';
import { MinRepositoryProfileParseModel } from '../../common/parse-models';
import fragments from '../../common/fragments';

export default class GetPublicUserRespositoryOwnershipsRequest extends GraphQLPagedRequest<
    OrganizationProfileMinified
> {
    fragment = fragments.minifiedRepository;
    query = `
        query GetUserRepositoryOwnerships($name: String!, $after: String) {
            user(login: $name) {
                repositories(first: 100, after: $after, privacy: PUBLIC, affiliations: OWNER, ownerAffiliations: OWNER) {
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

    parseResponse(rawData: object): RepositoryProfileMinified[] {
        super.parseResponse(rawData); // Essential – updates page-info with data from response object

        const results = getValueForFirstKey(rawData, 'nodes') as object;
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse and returns each element in response data on current page
        return Object.values(results).map(
            (curValue): RepositoryProfileMinified => {
                return plainToClass(MinRepositoryProfileParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
