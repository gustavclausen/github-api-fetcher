import APIFetcher from './api-fetcher';
import config from '../config';
import requests from './graphql/requests/unified';
import { getValueForFirstKey } from '../lib/object-utils';
import { GraphQLClient } from 'graphql-request';
import { UserProfile, OrganizationProfileMinified } from '../models';
import { ResponseError, ResponseErrorType } from '../lib/errors';
import { GraphQLRequest } from './graphql/utils';

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeEach((): void => {
        fetcher = new APIFetcher('demo-access-token');
    });

    describe('constructor', (): void => {
        it('should set access token from parameter if set', (): void => {
            const accessToken = 'token';

            fetcher = new APIFetcher(accessToken);
            const setAuthorizationHeader = getValueForFirstKey(fetcher, 'Authorization');

            expect(setAuthorizationHeader).toBe(`Bearer ${accessToken}`);
        });

        it('should set access token from config module if no parameter is given', (): void => {
            const accessToken = 'accessTokenFromConfig';

            // Mock config where access token is set defined
            jest.mock('../config');
            config.apiAccessToken = accessToken;

            fetcher = new APIFetcher();
            const authorizationHeader = getValueForFirstKey(fetcher, 'Authorization');

            expect(authorizationHeader).toBe(`Bearer ${accessToken}`);
        });

        it('should throw error if no access token is set', (): void => {
            // Mock config where access token is retrieved
            jest.mock('../config');
            config.apiAccessToken = undefined;

            expect((): APIFetcher => new APIFetcher()).toThrowError();
        });
    });

    describe('fetch', (): void => {
        let request: GraphQLRequest<UserProfile>;
        let errorToThrow: EndpointResponseError | null;

        beforeEach((): void => {
            request = new requests.UserProfile('demo-user');
            errorToThrow = null;
        });

        class EndpointResponseError extends Error {
            response!: object;

            constructor(response: object) {
                super();
                this.response = response;
            }
        }

        const setupClientMock = (): void => {
            jest.mock('graphql-request');

            GraphQLClient.prototype.rawRequest = jest
                .fn()
                .mockImplementation((): Promise<never> => Promise.reject(errorToThrow));
        };

        const assertThrownError = async (expectedType: ResponseErrorType): Promise<void> => {
            try {
                await fetcher.fetch(request);
            } catch (error) {
                const requestError = error as ResponseError;

                expect(requestError.type).toBe(expectedType);
                expect(requestError.message).toBeDefined();
            }
        };

        it('should return null when ResponseError is of NOT_FOUND type', async (): Promise<void> => {
            errorToThrow = new EndpointResponseError({
                errors: [
                    {
                        type: 'NOT_FOUND'
                    }
                ],
                status: 200
            });
            setupClientMock();

            expect(await fetcher.fetch(request)).toBe(null);
        });

        it('should throw ResponseError with INSUFFICIENT_SCOPES type when response contains access token scope error', async (): Promise<
            void
        > => {
            errorToThrow = new EndpointResponseError({
                errors: [
                    {
                        type: 'INSUFFICIENT_SCOPES'
                    }
                ],
                status: 200
            });
            setupClientMock();

            await assertThrownError(ResponseErrorType.INSUFFICIENT_SCOPES);
        });

        it('should throw ResponseError with BAD_CREDENTIALS type when response contains status code 401', async (): Promise<
            void
        > => {
            errorToThrow = new EndpointResponseError({
                status: 401
            });
            setupClientMock();

            await assertThrownError(ResponseErrorType.BAD_CREDENTIALS);
        });

        it('should throw ResponseError with ACCESS_FORBIDDEN type when response contains status code 403', async (): Promise<
            void
        > => {
            errorToThrow = new EndpointResponseError({
                status: 403
            });

            await assertThrownError(ResponseErrorType.ACCESS_FORBIDDEN);
        });

        it('should throw ResponseError with GITHUB_SERVER_ERROR type when response contains status code >= 500', async (): Promise<
            void
        > => {
            errorToThrow = new EndpointResponseError({
                status: 503
            });

            await assertThrownError(ResponseErrorType.GITHUB_SERVER_ERROR);
        });

        it('should throw ResponseError with UNKNOWN type when error cannot be classified', async (): Promise<void> => {
            errorToThrow = new EndpointResponseError({});

            await assertThrownError(ResponseErrorType.UNKNOWN);
        });
    });

    describe('pageFetch', (): void => {
        it('should call fetch for each page and return a combined result of all elements', async (): Promise<void> => {
            const request = new requests.UserOrganizationMemberships('demo-user');
            const firstPageResult: OrganizationProfileMinified[] = [
                {
                    gitHubId: 'random-id-1',
                    name: 'some-organization-name-1'
                },
                {
                    gitHubId: 'random-id-2',
                    name: 'random-organization-name-2'
                }
            ];
            const secondPageResult: OrganizationProfileMinified[] = [
                {
                    gitHubId: 'random-id-3',
                    name: 'random-organization-name-3'
                }
            ];

            jest.mock('./api-fetcher');
            APIFetcher.prototype.fetch = jest
                .fn()
                .mockImplementationOnce(
                    (): Promise<OrganizationProfileMinified[] | null> => {
                        request.pageInfo = {
                            hasNextPage: true,
                            nextElement: secondPageResult[0].gitHubId
                        };
                        return Promise.resolve(firstPageResult);
                    }
                )
                .mockImplementationOnce(
                    (): Promise<OrganizationProfileMinified[] | null> => {
                        request.pageInfo = {
                            hasNextPage: false,
                            nextElement: null
                        };
                        return Promise.resolve(secondPageResult);
                    }
                );

            expect(await fetcher.pageFetch(request)).toMatchObject(firstPageResult.concat(secondPageResult));
        });
    });
});
