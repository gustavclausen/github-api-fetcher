import _ from 'lodash';
import config from '../../../src/etc/config';
import uuid from 'uuid';

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
 * Returns username of non-existing GitHub user
 */
const getUsernameOfNonExistingUser = async (): Promise<string> => {
    let nonExistingUsername: string | null = null;

    while (!nonExistingUsername) {
        const randomUUID = uuid();

        try {
            await fetchGitHubAPI(`users/${randomUUID}`);
        } catch (error) {
            const requestError = error as RequestError;

            if (requestError.statusCode === 404) {
                nonExistingUsername = randomUUID;
                break;
            } else {
                continue;
            }
        }
    }

    return nonExistingUsername;
};

/**
 * Fetches random organization and returns its name
 */
const getNameOfRandomOrganization = async (): Promise<string> => {
    const randomOrganization = _.sample(await fetchGitHubAPI('organizations')) as object;

    return _.get(randomOrganization, 'login') as string; // Get login (name) of random selected organization
};

/**
 * Returns name of non-existing organization
 */
const getNameOfNonExistingOrganization = async (): Promise<string> => {
    let nonExistingOrganization: string | null = null;

    while (!nonExistingOrganization) {
        const randomUUID = uuid();

        try {
            await fetchGitHubAPI(`orgs/${randomUUID}`);
        } catch (error) {
            const requestError = error as RequestError;

            if (requestError.statusCode === 404) {
                nonExistingOrganization = randomUUID;
                break;
            } else {
                continue;
            }
        }
    }

    return nonExistingOrganization;
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

/**
 * Returns username of owner (user/organization) and name of non-existing repository as tuple
 */
const getNonExistingRepository = async (): Promise<[string, string]> => {
    let nonExistingRepository: [string, string] | null = null;

    while (!nonExistingRepository) {
        const randomUUID = uuid();

        try {
            await fetchGitHubAPI(`repos/${randomUUID}/${randomUUID}`);
        } catch (error) {
            const requestError = error as RequestError;

            if (requestError.statusCode === 404) {
                nonExistingRepository = [randomUUID, randomUUID];
                break;
            } else {
                continue;
            }
        }
    }

    return nonExistingRepository;
};

export default {
    getUsernameOfRandomUser,
    getUsernameOfNonExistingUser,
    getNameOfRandomOrganization,
    getNameOfNonExistingOrganization,
    getRandomRepository,
    getNonExistingRepository
};
