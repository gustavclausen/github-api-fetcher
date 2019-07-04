import _ from 'lodash';
import config from '../etc/config';
import { GraphQLClient } from 'graphql-request';
import { GraphQLRequest, AbstractPagedRequest } from './graphql/utils';
import { RequestError, ResponseErrorType } from '../lib/errors';
import UserRoute from './routes/user';
import OrganizationRoute from './routes/organization';
import RepositoryRoute from './routes/repository';

export default class APIFetcher {
    private graphQLClient: GraphQLClient;

    user = new UserRoute(this);
    organization = new OrganizationRoute(this);
    repository = new RepositoryRoute(this);

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

    async fetch<T>(request: GraphQLRequest<T>): Promise<T | null> {
        try {
            const response = await this.graphQLClient.rawRequest(request.query, request.variables);

            return request.parseResponse(response.data);
        } catch (error) {
            const classifiedError = APIFetcher.classifyResponseError(error) as RequestError;

            if (classifiedError.type === ResponseErrorType.NOT_FOUND) {
                return null;
            }

            throw classifiedError;
        }
    }

    async pageFetch<T>(pagedRequest: AbstractPagedRequest<T>): Promise<T[] | null> {
        let fetchResults = await this.fetch<T[]>(pagedRequest);

        // Fetch next elements while there is any
        while (fetchResults && pagedRequest.hasNextPage()) {
            const nextFetchResults = await this.fetch<T[]>(pagedRequest);

            if (!nextFetchResults) break;

            fetchResults = fetchResults.concat(nextFetchResults);
        }

        return fetchResults;
    }

    private static classifyResponseError(error: Error): RequestError {
        const responseStatusCode = _.get(error, 'response.status') as number;
        const topLevelResponseErrorMessage = _.get(error, 'response.message') as string;

        // Finds and classifies error in nested response object
        const aux = (error: Error): RequestError => {
            const responseErrors = _.get(error, 'response.errors') as object[];

            if (responseErrors && !_.isEmpty(responseErrors)) {
                const firstResponseError: { type?: string; message?: string } = responseErrors[0];

                switch (firstResponseError.type) {
                    case 'NOT_FOUND':
                        return new RequestError(
                            ResponseErrorType.NOT_FOUND,
                            firstResponseError.message ? firstResponseError.message : `Resource not found`
                        );
                    case 'INSUFFICIENT_SCOPES':
                        const baseErrorMessage = 'Insufficient scopes to perform request';
                        return new RequestError(
                            ResponseErrorType.INSUFFICIENT_SCOPES,
                            firstResponseError.message
                                ? `${baseErrorMessage}. Error message: ${firstResponseError.message}`
                                : baseErrorMessage
                        );
                }
            }

            return new RequestError(ResponseErrorType.UNKNOWN, error.message);
        };

        if (responseStatusCode) {
            if (responseStatusCode >= 500) {
                return new RequestError(
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
                    return new RequestError(
                        ResponseErrorType.BAD_CREDENTIALS,
                        topLevelResponseErrorMessage ? topLevelResponseErrorMessage : 'Bad credentials provided'
                    );
                case 403:
                    return new RequestError(
                        ResponseErrorType.ACCESS_FORBIDDEN,
                        topLevelResponseErrorMessage
                            ? topLevelResponseErrorMessage
                            : 'Request forbidden by GitHub endpoint. Check if abuse detection mechanism is triggered or rate limit is exceeded.'
                    );
            }
        }

        return new RequestError(ResponseErrorType.UNKNOWN, error.message);
    }
}
