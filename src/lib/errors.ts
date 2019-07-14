/**
 * Different types of classified errors thrown by the GitHub API endpoint upon a request
 */
export enum ResponseErrorType {
    /**
     * The scopes provided in the access token is not sufficient to perform the request
     */
    INSUFFICIENT_SCOPES,
    /**
     * Access token is not valid
     */
    BAD_CREDENTIALS,
    /**
     * E.g. triggered the abuse detection mechanism, or rate limit is hit
     */
    ACCESS_FORBIDDEN,
    /**
     * E.g. resource (e.g user or organization) not found (equal to HTTP status code 404)
     */
    NOT_FOUND,
    /**
     * GitHub API replies with an server-side error
     */
    GITHUB_SERVER_ERROR,
    /**
     * Arbitrary, unknown error – typically syntax error in GraphQL query sent to endpoint
     */
    UNKNOWN
}

/**
 * Error describing failed request to GitHub API endpoint
 */
export class RequestError extends Error {
    type!: ResponseErrorType;

    constructor(type: ResponseErrorType, message: string) {
        super(message);
        Object.setPrototypeOf(this, RequestError.prototype); // Set the prototype explicitly

        this.type = type;
    }
}

/**
 * Error describing failure of parsing response data from GitHub API endpoint according to a defined schema
 */
export class ParseError extends Error {
    dataToParse!: object;

    constructor(dataToParse: object) {
        super('Unable to parse data');
        Object.setPrototypeOf(this, ParseError.prototype); // Set the prototype explicitly

        this.dataToParse = dataToParse;
    }
}
