export enum ResponseErrorType {
    INSUFFICIENT_SCOPES, // The scopes provided in the access token is not sufficient to perform the request
    BAD_CREDENTIALS, // Access token is not valid
    ACCESS_FORBIDDEN, // E.g. triggered the abuse detection mechanism, or rate limit is hit
    NOT_FOUND, // E.g. user or organization profile not found (equal to 404)
    GITHUB_SERVER_ERROR, // GitHub API server responses with an server-side error
    UNKNOWN // Arbitrary, unknown error – typically syntax error in GraphQL query set to endpoint
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
