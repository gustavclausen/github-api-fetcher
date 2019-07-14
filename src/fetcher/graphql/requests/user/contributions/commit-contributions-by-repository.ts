import { GraphQLRequest } from '../../../utils';
import { parseContributionsByRepository } from '../../../common/parse-models';
import { ContributionsByRepository } from '../../../../../models';
import { Month } from '../../../../../lib/date-utils';
import fragments from '../../../common/fragments';

export default class GetUserCommitContributionsByRepositoryRequest
    implements GraphQLRequest<ContributionsByRepository[]> {
    query = `
        query GetUserCommitContributionsByRepository($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    commitContributionsByRepository(maxRepositories: 100) {
                        repository {
                            ...${fragments.minifiedRepository.name}
                        }
                        count: contributions {
                            totalCount
                        }
                    }
                }
            }
        }

        ${fragments.minifiedRepository}
    `;
    variables: object | undefined;

    constructor(username: string, inYear: number, inMonth: Month) {
        this.variables = {
            username: username,
            /**
             * From first to last day of month.
             * Converted to ISO-8601 encoded UTC date string (compatible with DateTime type for GraphQL schema)
             */
            from: new Date(inYear, inMonth, 0, 0, 0, 0).toISOString(),
            to: new Date(inYear, inMonth, 31, 23, 59, 59).toISOString()
        };
    }

    parseResponse(rawData: object): ContributionsByRepository[] {
        return parseContributionsByRepository(rawData, 'commitContributionsByRepository');
    }
}
