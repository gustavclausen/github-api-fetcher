import { APIFetcher, GraphQLRequest, GraphQLFragment, GraphQLObjectField } from 'github-api-fetcher';

/*
 * Pass access token as argument in constructor, or load from environment
 * variable (see 'Configuration' section)
 */
const fetcher = new APIFetcher('<SECRET-ACCESS-TOKEN>');

// Response data model
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
    // Defines fields on a GraphQL object (see: https://graphql.org/learn/queries/#fields)
    new GraphQLObjectField('login', 'username'),
    new GraphQLObjectField('name')
]);

/**
 * Represents the GraphQL request to be sent to the endpoint.
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
        return Object(rawData)['user'] as UserProfile;
    }
}

(async (): Promise<void> => {
    const userProfile = await fetcher.fetch(new SimpleUserRequest('torvalds'));

    // 'fetch' returns null for non-existing users
    if (!userProfile) {
        console.log('User not found');
        return;
    }

    console.log(userProfile); // Outputs: { username: 'torvalds', name: 'Linus Torvalds' }
})();
