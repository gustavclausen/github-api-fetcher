import _ from 'lodash';
import config from '../../../src/etc/config';
import uuid from 'uuid';
import { Month } from '../../../src/lib/date-utils';

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
 * @param resourceUri resource path on GitHub API
 */
async function fetchGitHubAPI(resourceUri: string): Promise<object[]> {
    if (!config.apiAccessToken) {
        throw new Error('API access token not set');
    }

    const response = await fetch(`https://api.github.com/${resourceUri}`, {
        headers: {
            Authorization: `Bearer ${config.apiAccessToken}`,
            Accept: 'application/vnd.github.v3+json application/vnd.github.cloak-preview',
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new RequestError(response.status, response.statusText);
    }

    return (await response.json()) as object[];
}

/**
 * Returns username of non-existing GitHub user
 */
async function getUsernameOfNonExistingUser(): Promise<string> {
    let nonExistingUsername: string | null = null;

    while (!nonExistingUsername) {
        const randomUUID = uuid(); // Generate random ID

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
}

/**
 * Picks a random object from the list of objects taken as argument, and returns the date-time property
 * of that object according to the key path taken as argument.
 * Month and year of the date-time property is returned as a tuple: [year, month].
 *
 * @param objs Objects containing date-time properties
 * @param dateTimeKeyPath The key path where the date-time can be retrieved
 */
function getDateTimeOfRandomObject(objs: object[], dateTimeKeyPath: string): [number, Month] | null {
    const randomObject = _.sample(objs) as object;
    if (!randomObject) return null;

    const dateTimeValue = new Date(_.get(randomObject, dateTimeKeyPath));
    if (!dateTimeValue) return null;

    const month = Month[dateTimeValue.getMonth()];
    const year = dateTimeValue.getFullYear();

    return [year, Month[month as keyof typeof Month]];
}

/**
 * Returns a random month of a year where the user has contributed with a commit.
 * Return type is: [year, month]
 *
 * @param username The GitHub username of the user
 */
async function getRandomCommitContributionTime(username: string): Promise<[number, Month] | null> {
    const searchResults = _.get(
        await fetchGitHubAPI(
            `search/commits?q=committer:${username}+is:public&sort=committer-date&order=desc&per_page=10&type=Commits`
        ),
        'items'
    ) as object[];

    return getDateTimeOfRandomObject(searchResults, 'commit.committer.date');
}

/**
 * Returns a random month of a year where the user has contributed with an issue.
 * Return type is: [year, month]
 *
 * @param username The GitHub username of the user
 */
async function getRandomIssueContributionTime(username: string): Promise<[number, Month] | null> {
    const searchResults = _.get(
        await fetchGitHubAPI(
            `search/issues?q=author:${username}+type:issue+is:public&sort=created&order=desc&per_page=10`
        ),
        'items'
    ) as object[];

    return getDateTimeOfRandomObject(searchResults, 'created_at');
}

/**
 * Returns a random month of a year where the user has contributed with a pull request review.
 * Return type is: [year, month]
 *
 * @param username The GitHub username of the user
 */
async function getRandomPRReviewContributionTime(username: string): Promise<[number, Month] | null> {
    const searchResults = _.get(
        await fetchGitHubAPI(
            `search/issues?q=reviewed-by:${username}+type:pr+is:public&sort=created&order=desc&per_page=10`
        ),
        'items'
    ) as object[];

    return getDateTimeOfRandomObject(searchResults, 'updated_at');
}

/**
 * Returns a random month of a year where the user has contributed with a pull request.
 * Return type is: [year, month]
 *
 * @param username The GitHub username of the user
 */
async function getRandomPRContributionTime(username: string): Promise<[number, Month] | null> {
    const searchResults = _.get(
        await fetchGitHubAPI(
            `search/issues?q=author:${username}+type:pr+is:public&sort=created&order=desc&per_page=10`
        ),
        'items'
    ) as object[];

    return getDateTimeOfRandomObject(searchResults, 'created_at');
}

/**
 * Fetches random gist, and returns username of owner and id of the gist as tuple
 */
async function getRandomGist(): Promise<[string, string]> {
    const randomGists = await fetchGitHubAPI('gists/public');
    const randomGist = _.sample(randomGists) as object;

    const ownerUsername = _.get(randomGist, 'owner.login') as string;
    const gistId = _.get(randomGist, 'id') as string;

    return [ownerUsername, gistId];
}

/**
 * Returns true if user owns a public gist
 */
async function userHasPublicGist(username: string): Promise<boolean> {
    const gists = (await fetchGitHubAPI(`users/${username}/gists`)) as object[];

    return gists.length > 0;
}

/**
 * Returns username of owner and name of the gist of non-existing gist as tuple
 */
async function getNonExistingGist(): Promise<[string, string]> {
    let nonExistingGist: [string, string] | null = null;

    while (!nonExistingGist) {
        const randomUUID = uuid(); // Generate random ID

        try {
            await fetchGitHubAPI(`gists/${randomUUID}`);
        } catch (error) {
            const requestError = error as RequestError;

            if (requestError.statusCode === 404) {
                nonExistingGist = [randomUUID, randomUUID];
                break;
            } else {
                continue;
            }
        }
    }

    return nonExistingGist;
}

/**
 * Fetches random user with multiple types of contributions, and returns its username
 */
async function getUsernameOfRandomUser(): Promise<string> {
    let randomUsername: string | null = null;

    while (!randomUsername) {
        const searchResults = _.get(await fetchGitHubAPI('search/users?q=type:user+repo:>0'), 'items'); // Fetch users with at least one repository
        const randomUser = _.sample(searchResults) as object;
        const username = _.get(randomUser, 'login') as string; // Get login (username) of random selected user

        // Checks that user has contributed with commits, issues, PRs, PR reviews and gist
        const commitContribution = await getRandomCommitContributionTime(username);
        const issueContribution = await getRandomIssueContributionTime(username);
        const PRReviewContribution = await getRandomPRReviewContributionTime(username);
        const PRContribution = await getRandomPRContributionTime(username);
        const hasPublicGist = await userHasPublicGist(username);

        // User does not meet requirement as mentioned above, thus find new profile
        if (!commitContribution || !issueContribution || !PRReviewContribution || !PRContribution || !hasPublicGist)
            continue;

        randomUsername = username;
    }

    return randomUsername;
}

/**
 * Fetches random organization and returns its name
 */
async function getNameOfRandomOrganization(): Promise<string> {
    const randomOrganization = _.sample(await fetchGitHubAPI('organizations')) as object;

    return _.get(randomOrganization, 'login') as string; // Get login (name) of random selected organization
}

/**
 * Returns name of non-existing organization
 */
async function getNameOfNonExistingOrganization(): Promise<string> {
    let nonExistingOrganization: string | null = null;

    while (!nonExistingOrganization) {
        const randomUUID = uuid(); // Generate random ID

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
}

/**
 * Fetches random repository, and returns username of owner (user/organization) and name of the repository as tuple
 */
async function getRandomRepository(): Promise<[string, string]> {
    // Fetch repositories with at least one topic, and has 'TypeScript' as primary programming language
    const searchResults = _.get(await fetchGitHubAPI('search/repositories?q=topics:>0+language:typescript'), 'items');
    const randomRepository = _.sample(searchResults) as object;

    const repoOwnerUsername = _.get(randomRepository, 'owner.login') as string;
    const repoName = _.get(randomRepository, 'name') as string;

    return [repoOwnerUsername, repoName];
}

/**
 * Returns username of owner (user/organization) and name of non-existing repository as tuple
 */
async function getNonExistingRepository(): Promise<[string, string]> {
    let nonExistingRepository: [string, string] | null = null;

    while (!nonExistingRepository) {
        const randomUUID = uuid(); // Generate random ID

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
}

export default {
    getUsernameOfRandomUser,
    getUsernameOfNonExistingUser,
    getRandomCommitContributionTime,
    getRandomIssueContributionTime,
    getRandomPRReviewContributionTime,
    getRandomPRContributionTime,
    getNameOfRandomOrganization,
    getNameOfNonExistingOrganization,
    getRandomRepository,
    getNonExistingRepository,
    getRandomGist,
    getNonExistingGist
};
