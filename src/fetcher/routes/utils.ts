import APIFetcher from '../api-fetcher';

/**
 * API fetcher for specific resource
 */
export class Routefetcher {
    protected fetcher: APIFetcher;

    constructor(fetcher: APIFetcher) {
        this.fetcher = fetcher;
    }
}
