import { GraphQLRequest } from '../../../utils';
import { parseContributionsByRepository } from '../../../common/parse-models';
import { ContributionsByRepository } from '../../../../../models';
import fragments from '../../../common/fragments';

export default class GetUserPullRequestReviewContributionsByRepositoryRequest
    implements GraphQLRequest<ContributionsByRepository[]> {
    query = `
        query GetUserPullRequestReviewContributionsByRepository($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    pullRequestReviewContributionsByRepository(maxRepositories: 100) {
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
        return parseContributionsByRepository(rawData, 'pullRequestReviewContributionsByRepository');
    }
}
