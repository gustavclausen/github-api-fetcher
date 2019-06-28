import APIFetcher from './api-fetcher';
import config from '../config';
import { getValueForFirstKey } from '../lib/object-utils';

describe('APIFetcher', (): void => {
    describe('constructor', (): void => {
        it('sets access token from parameter if set', (): void => {
            const accessToken = 'token';

            const fetcher = new APIFetcher(accessToken);
            const setAuthorizationHeader = getValueForFirstKey(fetcher, 'Authorization');

            expect(setAuthorizationHeader).toBe(`Bearer ${accessToken}`);
        });

        it('sets access token from environment if no parameter is given', (): void => {
            const accessToken = 'accessTokenFromEnvironment';

            // Mock config where access token is retrieved from the environment variables
            jest.mock('../config');
            config.apiAccessToken = accessToken;

            const fetcher = new APIFetcher();
            const setAuthorizationHeader = getValueForFirstKey(fetcher, 'Authorization');

            expect(setAuthorizationHeader).toBe(`Bearer ${accessToken}`);
        });

        it('throws error if no access token is set', (): void => {
            // Mock config where access token is retrieved from the environment variables
            jest.mock('../config');
            config.apiAccessToken = undefined;

            expect((): APIFetcher => new APIFetcher()).toThrowError();
        });
    });
});
