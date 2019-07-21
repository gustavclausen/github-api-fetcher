const { APIFetcher, GraphQLFragment, GraphQLObjectField } = require('github-api-fetcher');

/*
 * Pass access token as argument in constructor, or load from environment
 * variable (see 'Configuration' section)
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
    // Defines fields on a GraphQL object (see: https://graphql.org/learn/queries/#fields)
    new GraphQLObjectField('login', 'username'),
    new GraphQLObjectField('name')
]);

/**
 * Represents the GraphQL request to be sent to the endpoint.
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
        return rawData['user'];
    }
}

(async () => {
    const userProfile = await fetcher.fetch(new SimpleUserRequest('torvalds'));

    console.log(userProfile); // Outputs: { username: 'torvalds', name: 'Linus Torvalds' }
})();
