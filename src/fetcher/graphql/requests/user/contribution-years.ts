import { GraphQLRequest } from '../../utils';
import { ParseError } from '../../../../lib/errors';
import { getValueForFirstKey } from '../../../../lib/object-utils';

export default class GetUserContributionYearsRequest implements GraphQLRequest<number[]> {
    query = `
        query GetUserContributionYears($username: String!) {
            user(login: $username) {
                contributionsCollection {
                    contributionYears
                }
            }
        }
    `;
    variables: object | undefined;

    constructor(username: string) {
        this.variables = {
            username: username
        };
    }

    parseResponse(rawData: object): number[] {
        const contributionYears = getValueForFirstKey(rawData, 'contributionYears') as number[];
        if (!contributionYears) {
            throw new ParseError(rawData);
        }

        return contributionYears;
    }
}
