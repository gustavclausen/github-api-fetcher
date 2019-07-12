import _ from 'lodash';
import fragments from '../../../common/fragments';
import { GraphQLRequest } from '../../../utils';
import { getValueForFirstKey } from '../../../../../lib/object-utils';
import { ParseError } from '../../../../../lib/errors';
import { plainToClass } from 'class-transformer';
import { MinRepositoryProfileParseModel, PullRequestParseModel } from '../../../common/parse-models';
import { Month } from '../../../../../lib/date-utils';
import {
    PullRequestContributionByRepository,
    PullRequest,
    MonthlyPullRequestContributions,
    RepositoryProfileMinified
} from '../../../../../models';

export default class GetUserPullRequestContributionsByRepositoryRequest
    implements GraphQLRequest<MonthlyPullRequestContributions> {
    query = `
        query GetUserPullRequestContributionsByRepository($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    pullRequestContributionsByRepository(maxRepositories: 100) {
                        repository {
                            ...${fragments.minifiedRepository.name}
                        }
                        contributions(first: 100) {
                            nodes {
                                pullRequest {
                                    ...${fragments.pullRequest.name}
                                }
                            }
                        }
                    }
                }
            }
        }

        ${fragments.minifiedRepository}
        ${fragments.pullRequest}
    `;
    variables: object | undefined;
    inMonth: string;

    constructor(username: string, inYear: number, inMonth: Month) {
        this.variables = {
            username: username,
            /**
             * From first to last day of year.
             * Converted to ISO-8601 encoded UTC date string (compatible with DateTime type for GraphQL schema)
             */
            from: new Date(inYear, inMonth, 0, 0, 0, 0).toISOString(),
            to: new Date(inYear, inMonth, 31, 23, 59, 59).toISOString()
        };
        this.inMonth = Month[inMonth];
    }

    parseResponse(rawData: object): MonthlyPullRequestContributions {
        /*
        EXAMPLE DATA:
        {
            "user": {
                "contributionsCollection": {
                    "pullRequestContributionsByRepository": [
                        {
                            "repository": {
                                "gitHubId": "MDEwOlJlcG9zaXRvcnkxNzc3NTgzMDM=",
                                "name": "demo",
                                "isPrivate": false,
                                "ownerName": {
                                    "name": "demo-user"
                                }
                            },
                            "contributions": {
                                "nodes": [
                                    {
                                        "pullRequest": {
                                            "title": "#37",
                                            "creationDateTime": "2019-01-01T12:00:00Z",
                                            "isMerged": true,
                                            "isClosed": true,
                                            "additionsCount": 1,
                                            "deletionsCount": 1,
                                            "publicUrl": "https://github.com/demo-user/demo/pull/44"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
        */
        const contributionData = getValueForFirstKey(rawData, 'pullRequestContributionsByRepository');
        if (!contributionData) {
            throw new ParseError(rawData);
        }

        // Helper method to retrieve repository object
        const getRepository = (rawData: object): RepositoryProfileMinified => {
            return plainToClass(MinRepositoryProfileParseModel, _.get(rawData, 'repository'), {
                excludeExtraneousValues: true
            });
        };
        // Filter out PR contributions in private repositories
        const publicContributions = _.filter(Object.values(contributionData), (contribution): boolean => {
            return !getRepository(contribution).isPrivate;
        });
        // Format contributions as 'PullRequestContributionByRepository' type
        const publicPullRequestContributions = Object.values(publicContributions).map(
            (curValue): PullRequestContributionByRepository => {
                const repository = getRepository(curValue);
                const pullRequestContributions = Object.values(getValueForFirstKey(curValue, 'nodes') as object[]).map(
                    (node): PullRequest => {
                        // Transform node to PR model
                        return plainToClass(PullRequestParseModel, _.get(node, 'pullRequest'), {
                            excludeExtraneousValues: true
                        });
                    }
                );

                return {
                    repository,
                    pullRequestContributions
                };
            }
        );

        // Gather count of PR contributions in private repositories
        const privatePullRequestContributionsCount = _.reduce(
            Object.values(contributionData),
            (acc: number, curValue: object): number => {
                const repository = getRepository(curValue);
                if (!repository.isPrivate) return acc;

                // Return number of PR contributions in private repository (+ acc)
                return acc + (getValueForFirstKey(curValue, 'nodes') as object[]).length;
            },
            0
        );

        return {
            month: this.inMonth,
            privatePullRequestContributionsCount,
            publicPullRequestContributions
        };
    }
}
