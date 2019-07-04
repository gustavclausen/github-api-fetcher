import _ from 'lodash';
import APIFetcher from '../../src/main';
import config from '../../src/etc/config';
import { keys } from 'ts-transformer-keys';
import {
    UserProfile,
    OrganizationProfile,
    RepositoryProfileMinified,
    OrganizationProfileMinified,
    RepositoryProfile,
    ProgrammingLanguage,
    AppliedProgrammingLanguage
} from '../../src/models';

/**
 * Fetches GitHub REST V3 API for test data
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
        throw new Error(`
            Failed to fetch from GitHub API endpoint
            Status code: ${response.status}
            Status text: ${response.statusText}
        `);
    }

    return (await response.json()) as object[];
};

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeEach((): void => {
        fetcher = new APIFetcher();
    });

    describe('user route', (): void => {
        /**
         * Fetches random user and returns its username
         */
        const getUsernameOfRandomUser = async (): Promise<string> => {
            const searchResults = _.get(await fetchGitHubAPI('search/users?q=type:user+repo:>0'), 'items'); // Fetch users with at least one repository
            const randomUser = _.sample(searchResults) as object;

            return _.get(randomUser, 'login') as string; // Get login (username) of random selected user
        };

        it('getProfile should return model with all properties set', async (): Promise<void> => {
            let randomUsername = await getUsernameOfRandomUser();
            let result = await fetcher.user.getProfile(randomUsername);

            // Search for user with at least one organization membership
            while (result && _.isEmpty(result.organizationMemberships)) {
                randomUsername = await getUsernameOfRandomUser();
                result = await fetcher.user.getProfile(randomUsername);
            }

            if (!result) {
                throw new Error('No data to test on');
            }

            // Verify all top-level properties is set on user profile model
            _.forEach(keys<UserProfile>(), (propKey): void => {
                expect(_.get(result, propKey)).toBeDefined();
            });

            // Verify all properties set on nested 'organizationMemberships' property
            _.forEach(result.organizationMemberships, (organization): void => {
                _.forEach(keys<OrganizationProfileMinified>(), (propKey): void => {
                    expect(_.get(organization, propKey)).toBeDefined();
                });
            });

            // Verify all properties set on nested 'repositoryOwnerships' property
            _.forEach(result.repositoryOwnerships, (repository): void => {
                _.forEach(keys<RepositoryProfileMinified>(), (propKey): void => {
                    expect(_.get(repository, propKey)).toBeDefined();
                });
            });
        }, 30000);
    });

    describe('organization route', (): void => {
        /**
         * Fetches random organization and returns its name
         */
        const getNameOfRandomOrganization = async (): Promise<string> => {
            const randomOrganization = _.sample(await fetchGitHubAPI('organizations')) as object;

            return _.get(randomOrganization, 'login') as string; // Get login (name) of random selected organization
        };

        it('getProfile should return model with all properties set', async (): Promise<void> => {
            const randomOrganizationName = await getNameOfRandomOrganization();
            const result = await fetcher.organization.getProfile(randomOrganizationName);

            // Verify all top-level properties is set on organization profile model
            _.forEach(keys<OrganizationProfile>(), (propKey): void => {
                expect(_.get(result, propKey)).toBeDefined();
            });
        });
    });

    describe('repository route', (): void => {
        /**
         * Fetches random repository, and returns username of owner (user/organization) and name of repository as tuple
         */
        const getRandomRepository = async (): Promise<[string, string]> => {
            const searchResults = _.get(await fetchGitHubAPI('search/repositories?q=topics:>0'), 'items'); // Fetch repositories with at least one topic
            const randomRepository = _.sample(searchResults) as object;

            const repoOwnerUsername = _.get(randomRepository, 'owner.login') as string;
            const repoName = _.get(randomRepository, 'name') as string;

            return [repoOwnerUsername, repoName];
        };

        it('getProfile should return model with all properties set', async (): Promise<void> => {
            const [randomRepoOwnerUsername, randomRepoName] = await getRandomRepository();
            const result = await fetcher.repository.getProfile(randomRepoOwnerUsername, randomRepoName);

            if (!result) {
                throw new Error('No data to test on');
            }

            // Verify all properties set on repository profile model
            _.forEach(keys<RepositoryProfile>(), (propKey): void => {
                expect(_.get(result, propKey)).toBeDefined();
            });

            // Verify all properties set on nested 'primaryProgrammingLanguage' property
            _.forEach(keys<ProgrammingLanguage>(), (propKey): void => {
                expect(_.get(result.primaryProgrammingLanguage, propKey)).toBeDefined();
            });

            // Verify all properties set on nested 'appliedProgrammingLanguages' property
            _.forEach(result.appliedProgrammingLanguages, (programmingLanguage): void => {
                _.forEach(keys<AppliedProgrammingLanguage>(), (propKey): void => {
                    expect(_.get(programmingLanguage, propKey)).toBeDefined();
                });
            });
        });
    });
});
