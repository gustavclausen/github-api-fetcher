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
     * E.g. user or organization profile not found (equal to 404)
     */
    NOT_FOUND,
    /**
     * GitHub API server responses with an server-side error
     */
    GITHUB_SERVER_ERROR,
    /**
     * Arbitrary, unknown error – typically syntax error in GraphQL query set to endpoint
     */
    UNKNOWN
}

export class ResponseError extends Error {
    type!: ResponseErrorType;

    constructor(type: ResponseErrorType, message: string) {
        super(message);
        Object.setPrototypeOf(this, ResponseError.prototype); // Set the prototype explicitly

        this.type = type;
    }
}

export class ParseError extends Error {
    dataToParse!: object;

    constructor(dataToParse: object) {
        super('Unable to parse data');
        Object.setPrototypeOf(this, ParseError.prototype); // Set the prototype explicitly

        this.dataToParse = dataToParse;
    }
}
