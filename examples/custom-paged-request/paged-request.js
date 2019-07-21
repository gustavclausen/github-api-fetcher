const { APIFetcher, GraphQLFragment, GraphQLObjectField, GraphQLPagedRequest } = require('github-api-fetcher');

/*
 * Pass access token as argument in constructor, or load from environment
 * variable (see 'Configuration' section)
 */
const fetcher = new APIFetcher('<SECRET-ACCESS-TOKEN>');

/**
   Defines a GraphQL fragment, used in queries.
   See: https://graphql.org/learn/queries/#fragments

   Translates to the following GraphQL syntax:

    fragment RepositoryProfile on Repository {
        name
        repoOwner: owner {
            username: login,
            avatarUrl
        }
    }
 */
const repositoryProfile = new GraphQLFragment(
    'RepositoryProfile',
    'Repository',
    // Defines fields on a GraphQL object. See: https://graphql.org/learn/queries/#fields
    [
        new GraphQLObjectField('name'),
        new GraphQLObjectField('owner', 'repoOwner', [
            new GraphQLObjectField('login', 'username'),
            new GraphQLObjectField('avatarUrl')
        ])
    ]
);

/**
 * Presents a paged, stateful GraphQL request to be sent to the endpoint.
 * Responsible for defining the requests, updating the page state, and parsing the responses.
 */
class UserRepositoriesRequest extends GraphQLPagedRequest {
    constructor(username) {
        super({ username });

        this.query = `
            query UserRepositories($username: String!, $after: String) {
                user(login: $username) {
                    repositories(first: 100, after: $after) {
                        nodes {
                            ...${repositoryProfile.name}
                        }
                        pageInfo {
                            hasNextPage
                            nextElement: endCursor
                        }
                    }
                }
            }

            ${repositoryProfile}
        `;
    }

    parseResponse(rawData) {
        super.parseResponse(rawData); // Essential – updates page state and prepares next request

        /**
            Raw data format:

            "user": {
                "repositories": {
                    "nodes": [
                        {
                            "name": "tictactoe",
                            "repoOwner": {
                                "username": "gaearon",
                                "avatarUrl": "https://avatars0.githubusercontent.com/u/810438?v=4"
                            }
                        },
                        {
                            "name": "spacegray",
                            "repoOwner": {
                                "username": "kkga",
                                "avatarUrl": "https://avatars0.githubusercontent.com/u/1460122?v=4"
                            }
                        }
                        ...
                    ],
                    "pageInfo": {
                        "hasNextPage": true,
                        "nextElement": "Y3Vyc29yOnYyOpHOAmk6Fw=="
                    }
                }
            }
        */
        return rawData.user.repositories.nodes;
    }
}

(async () => {
    const userRepositories = await fetcher.pageFetch(new UserRepositoriesRequest('gaearon'));

    console.log(userRepositories.length); // Outputs: < 278
})();
