# GitHub API Fetcher

[![npm](https://img.shields.io/npm/v/github-api-fetcher.svg)](https://www.npmjs.com/package/github-api-fetcher)
[![CircleCI](https://circleci.com/gh/gustavclausen/github-api-fetcher/tree/master.svg?style=svg)](https://circleci.com/gh/gustavclausen/github-api-fetcher/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/gustavclausen/github-api-fetcher/badge.svg?branch=master)](https://coveralls.io/github/gustavclausen/github-api-fetcher?branch=master)
[![License](https://img.shields.io/github/license/gustavclausen/github-api-fetcher.svg)](https://github.com/gustavclausen/github-api-fetcher/blob/master/LICENSE)

## Introduction

This project is a simplified data fetching client for [GitHub's GraphQL v4 API](https://developer.github.com/v4/) – supporting Node.js and browsers for scripts, applications and data scraping.

### Features

* Simple, promise-based API for common requests like user/repository/organization profiles, contributions and more. Check out the next section to get a full overview of all predefined requests.
* Full TypeScript support.
* Simple error handling with defined error types.
* Adheres to [GitHub's best practices](https://developer.github.com/v3/guides/best-practices-for-integrators/) – such as dealing with abuse rate limits.
* Support for adding own GraphQL requests to send to endpoint.

### Predefined requests

**User:**

* User profile
* Organization memberships
* Public repository ownerships
* Contributions:
  * Years of contribution
  * Commit contributions (monthly and yearly)
  * Issue contributions (monthly and yearly)
  * Pull request contributions (monthly and yearly)
  * Pull request review contributions (monthly and yearly)

**Organization:**

* Organization profile

**Repository:**

* Repository profile

Checkout [the docs folder](https://github.com/gustavclausen/github-api-fetcher/tree/master/docs) for a complete overview of the API and the included models.

## Installation

```sh
npm i github-api-fetcher
```

## Configuration

TODO:

- Guide on granting GitHub access token with correct scopes
- (Optional) set token as ENV variable for ease of use

## Usage

### Quickstart - simple user profile request

**JavaScript implementation:**

~~~~JavaScript
const { APIFetcher } = require('github-api-fetcher');

/*
 * Pass access token as parameter in constructor, or load from environment
 * variables (see 'Configuration' section)
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

**TypeScript implementation:**

~~~~TypeScript
import { APIFetcher } from 'github-api-fetcher';

/*
 * Pass access token as parameter in constructor, or load from environment
 * variables (see 'Configuration' section)
 */
const fetcher = new APIFetcher('SECRET-ACCESS-TOKEN');

(async (): Promise<void> => {
    const userProfile = await fetcher.user.getProfile('torvalds');

    if (!userProfile) throw new Error('User profile does not exist'); // 'getProfile' returns null for non-existing users

    console.log(userProfile.displayName); // Outputs: Linus Torvalds
})();
~~~~

Output:

```sh
Linus Torvalds
```

### Examples

TODO:

- Error handling

## Extending with your own requests

You can build your own GraphQL request according to the documentation available here: https://developer.github.com/v4/.
It requires some knowledge about GraphQL queries.

TODO:

- Support for single and paged requests, fragments with plain and nested fields (with aliases and arguments).
See docs for more info.
- Extending existing requests with properties/renaming etc. (tests scales with new properties)

**JavaScript implementation:**

~~~~JavaScript
const { APIFetcher, GraphQLRequest, GraphQLFragment, GraphQLObjectField } = require('github-api-fetcher');

/*
 * Pass access token as parameter in constructor, or load from environment
 * variables (see 'Configuration' section)
 */
const fetcher = new APIFetcher('<SECRET-ACCESS-TOKEN>');

/**
   Defines a GraphQL fragment, used in queries.
   See: https://graphql.org/learn/queries/#fragments

   Translates to the following GraphQL syntax:

   fragment SimpleUserFragment on User {
      username: login
      name
   }
 */
const userFragment = new GraphQLFragment('SimpleUserFragment', 'User', [
    // Defines fields on a GraphQL object. See: https://graphql.org/learn/queries/#fields
    new GraphQLObjectField('login', 'username'),
    new GraphQLObjectField('name')
]);

/**
 * Presents the GraphQL request to be sent to the endpoint.
 * Responsible for defining the request, and parsing the response.
 */
class SimpleUserRequest {
    constructor(username) {
        this.query = `
            query SimpleRequest($username: String!) {
                user(login: $username) {
                    ...${userFragment.name}
                }
            }

            ${userFragment}
        `;
        this.variables = {
            username
        };
    }

    parseResponse(rawData) {
        /**
            Raw data format:

            "user": {
              "username": "torvalds",
              "name": "Linus Torvalds"
            }
         */
        return rawData["user"];
    }
}

(async () => {
    const userProfile = await fetcher.fetch(new SimpleUserRequest('torvalds'));

    console.log(userProfile);
})();
~~~~

Output:

```sh
{ username: 'torvalds', name: 'Linus Torvalds' }
```

**TypeScript implementation:**

~~~~TypeScript
import { APIFetcher, GraphQLRequest, GraphQLFragment, GraphQLObjectField } from 'github-api-fetcher';

/*
 * Pass access token as parameter in constructor, or load from environment
 * variables (see 'Configuration' section)
 */
const fetcher = new APIFetcher('<SECRET-ACCESS-TOKEN');

interface UserProfile {
    username: string;
    name: string;
}

/**
   Defines a GraphQL fragment, used in queries.
   See: https://graphql.org/learn/queries/#fragments

   Translates to the following GraphQL syntax:

   fragment SimpleUserFragment on User {
      username: login
      name
   }
 */
const userFragment = new GraphQLFragment('SimpleUserFragment', 'User', [
    // Defines fields on a GraphQL object. See: https://graphql.org/learn/queries/#fields
    new GraphQLObjectField('login', 'username'),
    new GraphQLObjectField('name')
]);

/**
 * Presents the GraphQL request to be sent to the endpoint.
 * Responsible for defining the request, and parsing the response.
 */
class SimpleUserRequest implements GraphQLRequest<UserProfile> {
    query = `
        query SimpleRequest($username: String!) {
            user(login: $username) {
                ...${userFragment.name}
            }
        }

        ${userFragment}
    `;
    variables: object | undefined;

    constructor(username: string) {
        this.variables = {
            username
        };
    }

    parseResponse(rawData: object): UserProfile {
        /**
            Raw data format:

            "user": {
              "username": "torvalds",
              "name": "Linus Torvalds"
            }
         */

        // Or transform to a class constructor with packages like: https://github.com/typestack/class-transformer (highly recommended)
        return Object(rawData)["user"] as UserProfile;
    }
}

(async () => {
    const userProfile = await fetcher.fetch(new SimpleUserRequest('torvalds'));

    if (!userProfile) throw new Error('User profile not found')

    console.log(userProfile);
})();
~~~~

Output:

```sh
{ username: 'torvalds', name: 'Linus Torvalds' }
```

## Contributing

TODO:

- Add issue with wishes
- Open pull requests with request
- NPM tasks
- Code of conduct

## License

Feel free to use the source code in any way you like – it's released under the [MIT License](https://github.com/gustavclausen/github-api-fetcher/blob/master/LICENSE).  
I would appreciate being credited, but it's most certainly not required!

## Maintainers

- Gustav Kofoed Clausen ([@gustavclausen](http://github.com/gustavclausen))
