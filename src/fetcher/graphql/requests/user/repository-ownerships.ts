import { Expose, plainToClass, Transform } from 'class-transformer';
import { OrganizationProfileMinified, RepositoryProfileMinified } from '../../../../models';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { AbstractPagedRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_OBJECT_NAMES, fragments } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';

class MinRepositoryProfileParseModel implements RepositoryProfileMinified {
    @Expose()
    gitHubId!: string;
    @Expose()
    name!: string;
    @Expose()
    @Transform((obj): string => obj['username'])
    ownerUsername!: string;
}

const minRepositoryFragment = new GraphQLFragment('minRepositoryProfile', GITHUB_OBJECT_NAMES.Repository, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('name'),
    new GraphQLObjectField('owner', 'ownerUsername', [new GraphQLObjectField('login', 'username')])
]);

export default class GetUserRespositoryOwnershipsRequest extends AbstractPagedRequest<OrganizationProfileMinified> {
    fragment = minRepositoryFragment;
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

    /**
     * Returns elements on current page
     * @param rawData Raw JSON object to parse
     */
    parseResponse(rawData: object): RepositoryProfileMinified[] {
        super.parseResponse(rawData);

        const results = getValueForFirstKey(rawData, 'nodes') as object;
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse each element in response data
        return Object.values(results).map(
            (curValue: object): RepositoryProfileMinified => {
                return plainToClass(MinRepositoryProfileParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
