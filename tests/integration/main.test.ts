import _ from 'lodash';
import APIFetcher from '../../src/main';
import config from '../../src/etc/config';
import { keys } from 'ts-transformer-keys';
import {
    UserProfile,
    OrganizationProfile,
    RepositoryProfileMinified,
    OrganizationProfileMinified
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
    const randomUserObject = _.sample(await fetchGitHubAPIEndpoint('users')) as object[];

    return _.get(randomUserObject, 'login') as string;
};

const getNameOfRandomOrganization = async (): Promise<string> => {
    const randomOrganizationObject = _.sample(await fetchGitHubAPIEndpoint('organizations')) as object[];

    return _.get(randomOrganizationObject, 'login') as string;
};

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeEach((): void => {
        fetcher = new APIFetcher();
    });

    it('getUserProfile should return model with all properties set', async (): Promise<void> => {
        let randomUsername = await getUsernameOfRandomUser();
        let result = await fetcher.getUserProfile(randomUsername);

        // Search for user with repository ownerships and organization memberships
        while (result && _.isEmpty(result.organizationMemberships) && _.isEmpty(result.repositoryOwnerships)) {
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
    });

    it('getOrganizationProfile should return model with all properties set', async (): Promise<void> => {
        const randomOrganizationName = await getNameOfRandomOrganization();
        const result = await fetcher.getOrganizationProfile(randomOrganizationName);

        _.forEach(keys<OrganizationProfile>(), (key): void => {
            expect(_.get(result, key)).toBeDefined();
        });
    });
});
