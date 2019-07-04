import _ from 'lodash';
import { plainToClass, Expose, Transform } from 'class-transformer';
import { GraphQLRequest } from '../../utils';
import { ParseError } from '../../../../lib/errors';
import { getValueForFirstKey } from '../../../../lib/object-utils';
import { MinRepositoryProfileParseModel } from '../../common/parse-models';
import { RepositoryProfileMinified, CommitContributionByRepository } from '../../../../models';
import fragments from '../../common/fragments';

class CommitContributionParseModel implements CommitContributionByRepository {
    @Expose()
    @Transform(
        (obj): RepositoryProfileMinified =>
            plainToClass(MinRepositoryProfileParseModel, obj, { excludeExtraneousValues: true })
    )
    repository!: RepositoryProfileMinified;

    @Expose()
    @Transform((obj): number => _.get(obj, 'totalCount'))
    commitCount!: number;
}

export default class GetUserCommitContributionsByRepositoryRequest
    implements GraphQLRequest<CommitContributionByRepository[]> {
    fragment = fragments.minifiedRepository;
    query = `
        query GetUserCommitContributionsByRepository($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    commitContributionsByRepository(maxRepositories: 100) {
                        repository {
                            ...${this.fragment.name}
                        }
                        commitCount: contributions {
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

    parseResponse(rawData: object): CommitContributionByRepository[] {
        const results = getValueForFirstKey(rawData, 'commitContributionsByRepository');
        if (!results) {
            throw new ParseError(rawData);
        }

        // Parse and returns each element in response data
        return Object.values(results).map(
            (curValue): CommitContributionByRepository => {
                return plainToClass(CommitContributionParseModel, curValue, { excludeExtraneousValues: true });
            }
        );
    }
}
