import { GraphQLFragment, GraphQLObjectField } from '../utils';

/**
 * Name of GitHub GraphQL objects to build fragments on
 */
export const GITHUB_GRAPHQL_OBJECT_NAMES = {
    PageInfo: 'PageInfo',
    User: 'User',
    Organization: 'Organization',
    Repository: 'Repository',
    Language: 'Language'
};

/**
 * Common GraphQL fragments to be used in requests
 */
export const fragments = {
    pageInfo: new GraphQLFragment('pageInfo', GITHUB_GRAPHQL_OBJECT_NAMES.PageInfo, [
        new GraphQLObjectField('hasNextPage'),
        new GraphQLObjectField('endCursor', 'nextElement')
    ]),
    language: new GraphQLFragment('language', GITHUB_GRAPHQL_OBJECT_NAMES.Language, [
        new GraphQLObjectField('name'),
        new GraphQLObjectField('color')
    ])
};
