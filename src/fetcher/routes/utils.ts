import APIFetcher from '../api-fetcher';

/**
 * @ignore
 * API fetcher for specific resource
 */
export class Routefetcher {
    protected fetcher: APIFetcher;

    /**
     * @ignore
     */
    constructor(fetcher: APIFetcher) {
        this.fetcher = fetcher;
    }
}
