import _ from 'lodash';
import APIFetcher from './api-fetcher';
import config from '../etc/config';
import { GraphQLClient } from 'graphql-request';
import { UserProfile, OrganizationProfileMinified } from '../models';
import { RequestError, ResponseErrorType } from '../lib/errors';
import { GraphQLRequest } from './graphql/utils';
import GetUserProfileRequest from './graphql/requests/user/profile';
import GetUserOrganizationMembershipsRequest from './graphql/requests/user/organization-memberships';

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeEach((): void => {
        fetcher = new APIFetcher('demo-access-token');
    });

    describe('constructor', (): void => {
        const getClientAuthorizationHeader = (): string =>
            _.get(fetcher, 'graphQLClient.options.headers.Authorization');

        it('should set access token from parameter if set', (): void => {
            const accessToken = 'token';

            fetcher = new APIFetcher(accessToken);

            expect(getClientAuthorizationHeader()).toBe(`Bearer ${accessToken}`);
        });

        it('should set access token from config module if no parameter is given', (): void => {
            const accessToken = 'accessTokenFromConfig';

            // Mock config where access token is set defined
            jest.mock('../etc/config');
            config.apiAccessToken = accessToken;

            fetcher = new APIFetcher();

            expect(getClientAuthorizationHeader()).toBe(`Bearer ${accessToken}`);
        });

        it('should throw error if no access token is set', (): void => {
            // Mock config where access token is retrieved
            jest.mock('../etc/config');
            config.apiAccessToken = undefined;

            expect((): APIFetcher => new APIFetcher()).toThrowError();
        });
    });

    describe('fetch', (): void => {
        let request: GraphQLRequest<UserProfile>;
        let errorToThrow: GitHubEndpointResponseError | null;

        beforeEach((): void => {
            request = new GetUserProfileRequest('demo-user');
            errorToThrow = null;

            // Setup client mock
            jest.mock('graphql-request');

            GraphQLClient.prototype.rawRequest = jest
                .fn()
                .mockImplementation((): Promise<never> => Promise.reject(errorToThrow));
        });

        class GitHubEndpointResponseError extends Error {
            response!: object;

            constructor(response: object) {
                super();
                this.response = response;
            }
        }

        const assertThrownError = async (expectedType: ResponseErrorType): Promise<void> => {
            try {
                await fetcher.fetch(request);
            } catch (error) {
                const requestError = error as RequestError;

                expect(requestError.type).toBe(expectedType);
                expect(requestError.message).toBeDefined();
            }
        };

        it('should return null when ResponseError is of NOT_FOUND type', async (): Promise<void> => {
            errorToThrow = new GitHubEndpointResponseError({
                errors: [
                    {
                        type: 'NOT_FOUND'
                    }
                ],
                status: 200
            });

            expect(await fetcher.fetch(request)).toBe(null);
        });

        it('should throw ResponseError with INSUFFICIENT_SCOPES type when response contains access token scope error', async (): Promise<
            void
        > => {
            errorToThrow = new GitHubEndpointResponseError({
                errors: [
                    {
                        type: 'INSUFFICIENT_SCOPES'
                    }
                ],
                status: 200
            });

            await assertThrownError(ResponseErrorType.INSUFFICIENT_SCOPES);
        });

        it('should throw ResponseError with BAD_CREDENTIALS type when response contains status code 401', async (): Promise<
            void
        > => {
            errorToThrow = new GitHubEndpointResponseError({
                status: 401
            });

            await assertThrownError(ResponseErrorType.BAD_CREDENTIALS);
        });

        it('should throw ResponseError with ACCESS_FORBIDDEN type when response contains status code 403', async (): Promise<
            void
        > => {
            errorToThrow = new GitHubEndpointResponseError({
                status: 403
            });

            await assertThrownError(ResponseErrorType.ACCESS_FORBIDDEN);
        });

        it('should throw ResponseError with GITHUB_SERVER_ERROR type when response contains status code >= 500', async (): Promise<
            void
        > => {
            errorToThrow = new GitHubEndpointResponseError({
                status: 503
            });

            await assertThrownError(ResponseErrorType.GITHUB_SERVER_ERROR);
        });

        it('should throw ResponseError with UNKNOWN type when error cannot be classified', async (): Promise<void> => {
            errorToThrow = new GitHubEndpointResponseError({});

            await assertThrownError(ResponseErrorType.UNKNOWN);
        });
    });

    describe('pageFetch', (): void => {
        it('should call fetch for each page and return a combined result of all elements', async (): Promise<void> => {
            const request = new GetUserOrganizationMembershipsRequest('demo-user');
            const firstPageResult: OrganizationProfileMinified[] = [
                {
                    gitHubId: 'random-id-1',
                    name: 'some-organization-name-1',
                    publicUrl: 'link-1.com'
                },
                {
                    gitHubId: 'random-id-2',
                    name: 'random-organization-name-2',
                    publicUrl: 'link-2.com'
                }
            ];
            const secondPageResult: OrganizationProfileMinified[] = [
                {
                    gitHubId: 'random-id-3',
                    name: 'random-organization-name-3',
                    publicUrl: 'link-3.com'
                }
            ];

            jest.mock('./api-fetcher');
            APIFetcher.prototype.fetch = jest
                .fn()
                // First result
                .mockImplementationOnce(
                    (): Promise<OrganizationProfileMinified[] | null> => {
                        request.pageInfo = {
                            hasNextPage: true,
                            nextElement: secondPageResult[0].gitHubId
                        };
                        return Promise.resolve(firstPageResult);
                    }
                )
                // Second result
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
