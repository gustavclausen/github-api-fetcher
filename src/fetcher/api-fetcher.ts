import _ from 'lodash';
import config from '../config';
import requests from './graphql/requests/unified';
import { GraphQLClient } from 'graphql-request';
import { UserProfile, OrganizationProfile, OrganizationProfileMinified } from '../models';
import { GraphQLRequest, AbstractPagedRequest } from './graphql/utils';
import { ResponseError, ResponseErrorType } from '../lib/errors';

export default class APIFetcher {
    private graphQLClient: GraphQLClient;

    constructor(apiAccessToken?: string) {
        // Search for API access token, and setup GraphQL client
        let accessToken = apiAccessToken ? apiAccessToken : config.apiAccessToken;
        if (!accessToken) {
            throw new Error('Config error');
        }

        this.graphQLClient = new GraphQLClient(config.apiEndpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }

    // TODO: Write integration test
    async getUserProfile(username: string): Promise<UserProfile | null> {
        const fetchedProfile = await this.fetch<UserProfile>(new requests.UserProfile(username));

        if (!fetchedProfile) return null;

        // Fetch info about organizations user is member of, and add result to profile
        const organizationMemberships = await this.getUserOrganizationMemberships(username);
        if (organizationMemberships) {
            fetchedProfile.organizationMemberships = organizationMemberships;
        }

        return fetchedProfile;
    }

    // TODO: Write integration test
    private async getUserOrganizationMemberships(username: string): Promise<OrganizationProfileMinified[] | null> {
        return await this.pageFetch<OrganizationProfileMinified>(new requests.UserOrganizationMemberships(username));
    }

    // TODO: Write integration test
    async getOrganizationProfile(organizationName: string): Promise<OrganizationProfile | null> {
        return await this.fetch<OrganizationProfile>(new requests.OrganizationProfile(organizationName));
    }

    async fetch<T>(request: GraphQLRequest<T>): Promise<T | null> {
        try {
            const response = await this.graphQLClient.rawRequest(request.query, request.variables);
            return request.parseResponse(response.data);
        } catch (error) {
            const classifiedError = APIFetcher.classifyResponseError(error) as ResponseError;

            if (classifiedError.type === ResponseErrorType.NOT_FOUND) {
                return null;
            }

            throw classifiedError;
        }
    }

    // TODO: Unit test
    async pageFetch<T>(pagedRequest: AbstractPagedRequest<T>): Promise<T[] | null> {
        const fetchResults = await this.fetch<T[]>(pagedRequest);

        if (!fetchResults) return null;

        // Fetch next elements while there is any
        while (pagedRequest.hasNextPage()) {
            const nextFetch = await this.graphQLClient.rawRequest(pagedRequest.query, pagedRequest.variables);
            fetchResults.concat(pagedRequest.parseResponse(nextFetch.data));
        }

        return fetchResults;
    }

    private static classifyResponseError(error: Error): ResponseError {
        const responseStatusCode = _.get(error, 'response.status') as number;
        const topLevelResponseErrorMessage = _.get(error, 'response.message');

        // Finds and classifies error in nested response object
        const aux = (error: Error): ResponseError => {
            const responseErrors = _.get(error, 'response.errors') as object[];

            if (responseErrors && !_.isEmpty(responseErrors)) {
                const firstResponseError: { type?: string; message?: string } = responseErrors[0];

                switch (firstResponseError.type) {
                    case 'NOT_FOUND':
                        return new ResponseError(
                            ResponseErrorType.NOT_FOUND,
                            firstResponseError.message ? firstResponseError.message : `Resource not found`
                        );
                    case 'INSUFFICIENT_SCOPES':
                        const baseErrorMessage = 'Insufficient scopes to perform request';
                        return new ResponseError(
                            ResponseErrorType.INSUFFICIENT_SCOPES,
                            firstResponseError.message
                                ? `${baseErrorMessage}. Error message: ${firstResponseError.message}`
                                : baseErrorMessage
                        );
                    default:
                        break;
                }
            }

            return new ResponseError(ResponseErrorType.UNKNOWN, error.message);
        };

        if (responseStatusCode) {
            if (responseStatusCode >= 500) {
                return new ResponseError(
                    ResponseErrorType.GITHUB_SERVER_ERROR,
                    topLevelResponseErrorMessage
                        ? topLevelResponseErrorMessage
                        : `GitHub API server responded with an error. Status code: ${responseStatusCode}`
                );
            }

            switch (responseStatusCode) {
                case 200:
                    return aux(error);
                case 401:
                    return new ResponseError(
                        ResponseErrorType.BAD_CREDENTIALS,
                        topLevelResponseErrorMessage ? topLevelResponseErrorMessage : 'Bad credentials provided'
                    );
                case 403:
                    return new ResponseError(
                        ResponseErrorType.ACCESS_FORBIDDEN,
                        topLevelResponseErrorMessage
                            ? topLevelResponseErrorMessage
                            : 'Request forbidden by GitHub endpoint. Check if abuse detection mechanism is triggered or rate limit is exceeded.'
                    );
                default:
                    break;
            }
        }

        return new ResponseError(ResponseErrorType.UNKNOWN, error.message);
    }
}
