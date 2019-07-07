import _ from 'lodash';
import config from '../../../src/etc/config';

/**
 * Error describing failed request to API endpoint
 */
class RequestError extends Error {
    statusCode!: number;

    constructor(statusCode: number, statusText: string) {
        super(statusText);
        Object.setPrototypeOf(this, RequestError.prototype); // Set the prototype explicitly

        this.statusCode = statusCode;
    }
}

/**
 * Fetches GitHub REST V3 API for test data
 *
 * @param resourceUri resource path
 */
const fetchGitHubAPI = async (resourceUri: string): Promise<object[]> => {
    if (!config.apiAccessToken) {
        throw new Error('API access token not set');
    }

    const response = await fetch(`https://api.github.com/${resourceUri}`, {
        headers: {
            Authorization: `Bearer ${config.apiAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new RequestError(response.status, response.statusText);
    }

    return (await response.json()) as object[];
};

/**
 * Fetches random user and returns its username
 */
const getUsernameOfRandomUser = async (): Promise<string> => {
    const searchResults = _.get(await fetchGitHubAPI('search/users?q=type:user+repo:>0'), 'items'); // Fetch users with at least one repository
    const randomUser = _.sample(searchResults) as object;

    return _.get(randomUser, 'login') as string; // Get login (username) of random selected user
};

/**
 * Fetches random organization and returns its name
 */
const getNameOfRandomOrganization = async (): Promise<string> => {
    const randomOrganization = _.sample(await fetchGitHubAPI('organizations')) as object;

    return _.get(randomOrganization, 'login') as string; // Get login (name) of random selected organization
};

/**
 * Fetches random repository, and returns username of owner (user/organization) and name of repository as tuple
 */
const getRandomRepository = async (): Promise<[string, string]> => {
    // Fetch repositories with at least one topic, and has 'TypeScript' as primary programming language
    const searchResults = _.get(await fetchGitHubAPI('search/repositories?q=topics:>0+language:typescript'), 'items');
    const randomRepository = _.sample(searchResults) as object;

    const repoOwnerUsername = _.get(randomRepository, 'owner.login') as string;
    const repoName = _.get(randomRepository, 'name') as string;

    return [repoOwnerUsername, repoName];
};

export default {
    getUsernameOfRandomUser,
    getNameOfRandomOrganization,
    getRandomRepository
};
