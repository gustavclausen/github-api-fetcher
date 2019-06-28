export enum RequestErrorType {
    INSUFFICIENT_SCOPE,
    BAD_CREDENTIALS,
    ACCESS_FORBIDDEN
}

export class RequestError extends Error {
    type!: RequestErrorType;

    constructor(type: RequestErrorType, message: string) {
        super(message);
        Object.setPrototypeOf(this, RequestError.prototype); // Set the prototype explicitly

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
