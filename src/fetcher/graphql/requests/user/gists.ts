import fragments from '../../common/fragments';
import { plainToClass } from 'class-transformer';
import { GistProfileMinified } from '../../../../models';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { GraphQLPagedRequest } from '../../utils';
import { ParseError } from '../../../../lib/errors';
import { MinGistProfileParseModel } from '../../common/parse-models';

export default class GetPublicUserGistsRequest extends GraphQLPagedRequest<GistProfileMinified> {
    query = `
        query GetUserGists($username: String!, $after: String) {
            user(login: $username) {
                gists(privacy: PUBLIC, first: 100, after: $after) {
                    nodes {
                        ...${fragments.minifiedGist.name}
                    }
                    pageInfo {
                        ...${fragments.pageInfo.name}
                    }
                }
            }
        }

        ${fragments.minifiedGist}
        ${fragments.pageInfo}
    `;

    constructor(username: string) {
        super({ username });
    }

    parseResponse(rawData: object): GistProfileMinified[] {
        super.parseResponse(rawData); // Essential – updates page-info with data from response object

        const results = getValueForFirstKey(rawData, 'nodes') as object;
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse and returns each element in response data on current page
        return Object.values(results).map(
            (curValue): GistProfileMinified => {
                return plainToClass(MinGistProfileParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
