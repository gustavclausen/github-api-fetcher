import _ from 'lodash';
import APIFetcher from '../../src/main';
import config from '../../src/etc/config';
import { UserProfile, OrganizationProfile } from '../../src/models';
import { keys } from 'ts-transformer-keys';

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
        const randomUsername = await getUsernameOfRandomUser();
        const result = await fetcher.getUserProfile(randomUsername);

        _.forEach(keys<UserProfile>(), (key): void => {
            expect(_.get(result, key)).toBeDefined();
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
