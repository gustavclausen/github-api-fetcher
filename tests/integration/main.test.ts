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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchGitHubAPIEndpoint = async (resourceUri: string): Promise<any> => {
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
        throw new Error(
            `Failed to fetch from GitHub API endpoint
            Status code: ${response.status}
            Status text: ${response.statusText}`
        );
    }

    return (await response.json()) as object[];
};

const getUsernameOfRandomUser = async (): Promise<string> => {
    const searchResults = _.get(await fetchGitHubAPIEndpoint('search/users?q=type:user+repo:>0'), 'items');
    const randomUserObject = _.sample(searchResults) as object;

    return _.get(randomUserObject, 'login') as string;
};

const getNameOfRandomOrganization = async (): Promise<string> => {
    const randomOrganizationObject = _.sample(await fetchGitHubAPIEndpoint('organizations')) as object;

    return _.get(randomOrganizationObject, 'login') as string;
};

const getRandomRepository = async (): Promise<[string, string]> => {
    const searchResults = _.get(await fetchGitHubAPIEndpoint('search/repositories?q=topics:>0'), 'items');
    const randomRepositoryObject = _.sample(searchResults) as object;

    return [_.get(randomRepositoryObject, 'owner.login') as string, _.get(randomRepositoryObject, 'name') as string];
};

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeEach((): void => {
        fetcher = new APIFetcher();
    });

    it('getUserProfile should return model with all properties set', async (): Promise<void> => {
        let randomUsername = await getUsernameOfRandomUser();
        let result = await fetcher.getUserProfile(randomUsername);

        // Search for user with organization memberships
        while (result && _.isEmpty(result.organizationMemberships)) {
            randomUsername = await getUsernameOfRandomUser();
            result = await fetcher.getUserProfile(randomUsername);
        }

        if (!result) {
            throw new Error('No data to test on');
        }

        // Verify all properties set on user profile model
        _.forEach(keys<UserProfile>(), (key): void => {
            expect(_.get(result, key)).toBeDefined();
        });

        // Verify all properties set on nested 'organizationMemberships' model
        _.forEach(result.organizationMemberships, (organization): void => {
            _.forEach(keys<OrganizationProfileMinified>(), (key): void => {
                expect(_.get(organization, key)).toBeDefined();
            });
        });

        // Verify all properties set on nested 'repositoryOwnerships' model
        _.forEach(result.repositoryOwnerships, (repository): void => {
            _.forEach(keys<RepositoryProfileMinified>(), (key): void => {
                expect(_.get(repository, key)).toBeDefined();
            });
        });
    }, 30000);

    it('getOrganizationProfile should return model with all properties set', async (): Promise<void> => {
        const randomOrganizationName = await getNameOfRandomOrganization();
        const result = await fetcher.getOrganizationProfile(randomOrganizationName);

        _.forEach(keys<OrganizationProfile>(), (key): void => {
            expect(_.get(result, key)).toBeDefined();
        });
    });

    it('getRepositoryProfile should return model with all properties set', async (): Promise<void> => {
        const randomRepository = await getRandomRepository();
        const result = await fetcher.getRepositoryProfile(randomRepository[0], randomRepository[1]);

        if (!result) {
            throw new Error('No data to test on');
        }

        // Verify all properties set on repository profile model
        _.forEach(keys<RepositoryProfile>(), (key): void => {
            expect(_.get(result, key)).toBeDefined();
        });

        // Verify all properties set on nested 'primaryProgrammingLanguage' model
        _.forEach(keys<ProgrammingLanguage>(), (key): void => {
            expect(_.get(result.primaryProgrammingLanguage, key)).toBeDefined();
        });

        // Verify all properties set on nested 'appliedProgrammingLanguages' model
        _.forEach(result.appliedProgrammingLanguages, (programmingLanguage): void => {
            _.forEach(keys<AppliedProgrammingLanguage>(), (key): void => {
                expect(_.get(programmingLanguage, key)).toBeDefined();
            });
        });
    });
});
