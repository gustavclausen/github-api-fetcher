# GitHub API Fetcher

[![npm](https://img.shields.io/npm/v/github-api-fetcher.svg)](https://www.npmjs.com/package/github-api-fetcher)
[![CircleCI](https://circleci.com/gh/gustavclausen/github-api-fetcher/tree/master.svg?style=svg)](https://circleci.com/gh/gustavclausen/github-api-fetcher/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/gustavclausen/github-api-fetcher/badge.svg?branch=master)](https://coveralls.io/github/gustavclausen/github-api-fetcher?branch=master)
[![License](https://img.shields.io/github/license/gustavclausen/github-api-fetcher.svg)](https://github.com/gustavclausen/github-api-fetcher/blob/master/LICENSE)
[![Greenkeeper badge](https://badges.greenkeeper.io/gustavclausen/github-api-fetcher.svg)](https://greenkeeper.io/)

GitHub API fetcher is a simplified data fetching client for [GitHub's GraphQL v4 API](https://developer.github.com/v4/) – supporting Node.js and browsers for all types of applications: websites, scripts, data scraping, plugins etc. Works seamlessly with both JavaScript and TypeScript.

## Features

* Simple, promise-based API for common requests like user/repository/organization profiles, contributions and more. Check out the next section to get a full overview of all predefined requests.
* Full TypeScript support.
* Simple error handling with defined error types.
* Adheres to [GitHub's best practices](https://developer.github.com/v3/guides/best-practices-for-integrators/) – such as dealing with abuse rate limits.
* Support for adding your own GraphQL requests.

### Predefined requests

#### User

* User profile
* Organization memberships
* Public repository ownerships
* Contributions:
  * Years of contribution
  * Commit contributions (monthly and yearly)
  * Issue contributions (monthly and yearly)
  * Pull request contributions (monthly and yearly)
  * Pull request review contributions (monthly and yearly)

#### Organization

* Organization profile

#### Repository

* Repository profile

#### Gist

* Gist profile


Check out [the documentation website](https://gustavclausen.github.io/github-api-fetcher/) for a complete overview of the API and the included models.

## Installation

```sh
npm i github-api-fetcher
```

## Configuration

#### GitHub access token

It's required to have a valid access token to use the client and access the GitHub API.
You've the option to use your own personal access token (see this [guide](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)), or create an OAuth app and use the authenticated user's access token (see this [guide](https://developer.github.com/apps/building-oauth-apps/)). Personal access tokens is recommended while developing since it's simple to setup, while the OAuth app setup is more complicated and should be used for public use.

The following scopes is required to use all predefined requests:

* repo:status
* public_repo
* read:org
* read:user

#### (Optional) Declare access token in environment variable

Instead of passing the access token as an argument when using the client, it's possible to declare the access token in an environment variable with the name: `GITHUB_FETCHER_API_ACCESS_TOKEN`.

## Usage

### Quickstart - simple user profile request

#### JavaScript

~~~~JavaScript
const { APIFetcher } = require('github-api-fetcher');

/*
 * Pass access token as argument in constructor, or load from environment
 * variable (see 'Configuration' section)
 */
const fetcher = new APIFetcher('SECRET-ACCESS-TOKEN');

(async () => {
    const userProfile = await fetcher.user.getProfile('torvalds');

    console.log(userProfile.displayName);
})();
~~~~

Output:

```sh
Linus Torvalds
```

#### TypeScript

~~~~TypeScript
import { APIFetcher } from 'github-api-fetcher';

/*
 * Pass access token as argument in constructor, or load from environment
 * variable (see 'Configuration' section)
 */
const fetcher = new APIFetcher('SECRET-ACCESS-TOKEN');

(async (): Promise<void> => {
    const userProfile = await fetcher.user.getProfile('torvalds');
  	
    // 'getProfile' returns null for non-existing users
    if (!userProfile) {
      console.log('User does not exist');
      return;
    }

    console.log(userProfile.displayName);
})();
~~~~

Output:

```sh
Linus Torvalds
```

### Routes

You access the requests by the route properties on the client as shown in the example below:

~~~~JavaScript
const fetcher = new APIFetcher('<SECRET-ACCESS-TOKEN>');

fetcher.user // User route
fetcher.organization // Organization route
fetcher.repository // Repository route
fetcher.gist // Gist route
~~~~

### Error handling

#### JavaScript

~~~~JavaScript
const { APIFetcher, ResponseErrorType } = require("github-api-fetcher");

const fetcher = new APIFetcher('not-a-valid-token');

(async () => {
  try {
    const userProfile = await fetcher.user.getProfile('torvalds');
    console.log(userProfile);
  } catch (err) {
    console.error(ResponseErrorType[err.type]);
  }
})();
~~~~

Output:

```sh
BAD_CREDENTIALS
```

#### TypeScript

~~~~TypeScript
import { APIFetcher, RequestError, ResponseErrorType } from "github-api-fetcher";

const fetcher = new APIFetcher('not-a-valid-token');

(async () => {
  try {
    const userProfile = await fetcher.user.getProfile('torvalds');

    // 'getProfile' returns null for non-existing users
    if (!userProfile) {
      console.log('User does not exist');
      return;
    }

    console.log(userProfile.displayName);
  } catch (err) {
    const requestError = err as RequestError;

    console.error(ResponseErrorType[requestError.type]);
  }
})();

~~~~

Output:

```sh
BAD_CREDENTIALS
```

## Modifying the project for your needs

Feel free to fork this repository to add, modify, delete requests and models to suit your needs.

### Extending with your own requests

You can build your own GraphQL queries following GitHub's schemas (documentation available here: https://developer.github.com/v4/).

Examples for custom requests can be found in the [examples folder](https://github.com/gustavclausen/github-api-fetcher/blob/master/examples/). These examples illustrates how to work with single and paged requests, as well as GraphQL fragments with plain and nested fields with aliases.

### Modifying models and requests

You can simply modify the base models and requests to add, modify or delete properties. Mulitple integration tests has been written to ensure all properties on the base models is being set upon parsing the response data.  
You can use the NPM task, ```npm test```, to run all tests.

## Contributing

This project needs your help! :muscle:

Please read [this document](https://github.com/gustavclausen/github-api-fetcher/blob/master/CONTRIBUTING.md). It explains how to contribute to this project.

## License

Feel free to use the source code in any way you like – it's released under the [MIT License](https://github.com/gustavclausen/github-api-fetcher/blob/master/LICENSE).  
I would appreciate being credited, but it's most certainly not required!

## Maintainers

- Gustav Kofoed Clausen ([@gustavclausen](http://github.com/gustavclausen))
