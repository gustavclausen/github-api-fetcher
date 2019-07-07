import _ from 'lodash';
import { plainToClass, Expose, Transform } from 'class-transformer';
import { GraphQLRequest } from '../../utils';
import { ParseError } from '../../../../lib/errors';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { MinRepositoryProfileParseModel } from '../../common/parse-models';
import { RepositoryProfileMinified, ContributionsByRepository } from '../../../../models';
import fragments from '../../common/fragments';

class IssueContributionsParseModel implements ContributionsByRepository {
    @Expose()
    @Transform(
        (obj): RepositoryProfileMinified =>
            plainToClass(MinRepositoryProfileParseModel, obj, { excludeExtraneousValues: true })
    )
    repository!: RepositoryProfileMinified;

    /**
     * Opened issue count
     */
    @Expose()
    @Transform((obj): number => _.get(obj, 'totalCount'))
    count!: number;
}

export default class GetUserIssueContributionsByRepositoryRequest
    implements GraphQLRequest<ContributionsByRepository[]> {
    fragment = fragments.minifiedRepository;
    query = `
        query GetUserIssueContributionsByRepository($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    issueContributionsByRepository(maxRepositories: 100) {
                        repository {
                            ...${this.fragment.name}
                        }
                        count: contributions {
                            totalCount
                        }
                    }
                }
            }
        }

        ${this.fragment}
    `;
    variables: object | undefined;

    constructor(username: string, inYear: number) {
        this.variables = {
            username: username,
            /**
             * From first to last day of year.
             * Converted to ISO-8601 encoded UTC date string (compatible with DateTime type for GraphQL schema)
             */
            from: new Date(inYear, 0, 0, 0, 0, 0).toISOString(),
            to: new Date(inYear, 11, 31, 23, 59, 59).toISOString()
        };
    }

    parseResponse(rawData: object): ContributionsByRepository[] {
        const results = getValueForFirstKey(rawData, 'issueContributionsByRepository');
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse and returns each element in response data
        return Object.values(results).map(
            (curValue): ContributionsByRepository => {
                return plainToClass(IssueContributionsParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
