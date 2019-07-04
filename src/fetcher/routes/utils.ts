import APIFetcher from '../api-fetcher';

export class Routefetcher {
    protected fetcher: APIFetcher;

    constructor(fetcher: APIFetcher) {
        this.fetcher = fetcher;
    }
}
