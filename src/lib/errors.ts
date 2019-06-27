export enum RequestErrorType {
    INSUFFICIENT_SCOPE,
    BAD_CREDENTIALS,
    ACCESS_FORBIDDEN
}

export class RequestError extends Error {
    type!: RequestErrorType;

    constructor(type: RequestErrorType, message: string) {
        super(message);
        this.type = type;
    }
}
