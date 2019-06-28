import _ from 'lodash';
import config from '../config';
import requests from './graphql/requests/unified';
import { GraphQLClient } from 'graphql-request';
import { UserProfile, OrganizationProfile, OrganizationProfileMinified } from '../models';
import { GraphQLRequest, AbstractPagedRequest } from './graphql/utils';
import { RequestError, RequestErrorType } from '../lib/errors';

enum GraphQLRequestError {
    NOT_FOUND, // E.g. user or organization profile not found
    UNKNOWN // Arbitrary, unknown error. Typically syntax error in GraphQL query set to endpoint.
}

export default class APIFetcher {
    private graphQLClient: GraphQLClient;

    // TODO: Write test to validate API access token is set in parameter or in environment
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

    // TODO: Unit test for error flow
    private async fetch<T>(request: GraphQLRequest<T>): Promise<T | null> {
        try {
            const response = await this.graphQLClient.rawRequest(request.query, request.variables);
            return request.parseResponse(response.data);
        } catch (error) {
            switch (APIFetcher.checkRequestError(error)) {
                case GraphQLRequestError.NOT_FOUND:
                    return null;
                default:
                    throw error;
            }
        }
    }

    // TODO: Unit test
    private async pageFetch<T>(pagedRequest: AbstractPagedRequest<T>): Promise<T[] | null> {
        const fetchResults = await this.fetch<T[]>(pagedRequest);

        if (!fetchResults) return null;

        // Fetch next elements while there is any
        while (pagedRequest.hasNextPage()) {
            const nextFetch = await this.graphQLClient.rawRequest(pagedRequest.query, pagedRequest.variables);
            fetchResults.concat(pagedRequest.parseResponse(nextFetch.data));
        }

        return fetchResults;
    }

    // TODO: Unit test control flow
    // TODO: Add comments
    private static checkRequestError(error: Error): GraphQLRequestError {
        const statusCode = _.get(error, 'response.status') as number;
        const topLevelErrorMessage = _.get(error, 'response.message');

        const classifyError = (error: Error): GraphQLRequestError => {
            const responseErrors = _.get(error, 'response.errors') as object[];

            if (responseErrors && !_.isEmpty(responseErrors)) {
                const firstError: { type?: string; message?: string } = responseErrors[0];

                switch (firstError.type) {
                    case 'NOT_FOUND':
                        return GraphQLRequestError.NOT_FOUND;
                    case 'INSUFFICIENT_SCOPES':
                        const baseErrorMessage = 'Insufficient scopes to perform request';
                        throw new RequestError(
                            RequestErrorType.INSUFFICIENT_SCOPE,
                            firstError.message
                                ? `${baseErrorMessage}. Error message: ${firstError.message}`
                                : baseErrorMessage
                        );
                }
            }

            return GraphQLRequestError.UNKNOWN;
        };

        if (statusCode) {
            switch (statusCode) {
                case 200:
                    return classifyError(error);
                case 401:
                    throw new RequestError(
                        RequestErrorType.BAD_CREDENTIALS,
                        topLevelErrorMessage ? topLevelErrorMessage : 'Bad credentials provided'
                    );
                case 403:
                    throw new RequestError(
                        RequestErrorType.ACCESS_FORBIDDEN,
                        topLevelErrorMessage
                            ? topLevelErrorMessage
                            : 'Request forbidden by GitHub endpoint. Check if abuse detection mechanism is triggered or rate limit is exceeded.'
                    );
            }
        }

        return GraphQLRequestError.UNKNOWN;
    }
}
