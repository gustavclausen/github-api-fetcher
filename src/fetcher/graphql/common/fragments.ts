import { GraphQLFragment, GraphQLObjectField } from '../utils';

/**
 * Name of GitHub GraphQL objects to build fragments on
 */
export const GITHUB_GRAPHQL_OBJECT_NAMES = {
    PageInfo: 'PageInfo',
    User: 'User',
    Organization: 'Organization',
    Repository: 'Repository',
    Language: 'Language',
    PullRequest: 'PullRequest'
};

/**
 * Common GraphQL fragments to be used in requests
 */
export default {
    pageInfo: new GraphQLFragment('pageInfo', GITHUB_GRAPHQL_OBJECT_NAMES.PageInfo, [
        new GraphQLObjectField('hasNextPage'),
        new GraphQLObjectField('endCursor', 'nextElement')
    ]),
    language: new GraphQLFragment('language', GITHUB_GRAPHQL_OBJECT_NAMES.Language, [
        new GraphQLObjectField('name'),
        new GraphQLObjectField('color')
    ]),
    minifiedRepository: new GraphQLFragment('minRepositoryProfile', GITHUB_GRAPHQL_OBJECT_NAMES.Repository, [
        new GraphQLObjectField('id', 'gitHubId'),
        new GraphQLObjectField('name'),
        new GraphQLObjectField('isPrivate'),
        new GraphQLObjectField('owner', 'ownerName', [new GraphQLObjectField('login', 'name')]),
        new GraphQLObjectField('url', 'publicUrl')
    ]),
    pullRequest: new GraphQLFragment('PullRequest', GITHUB_GRAPHQL_OBJECT_NAMES.PullRequest, [
        new GraphQLObjectField('title'),
        new GraphQLObjectField('createdAt', 'creationDateTime'),
        new GraphQLObjectField('merged', 'isMerged'),
        new GraphQLObjectField('closed', 'isClosed'),
        new GraphQLObjectField('additions', 'additionsCount'),
        new GraphQLObjectField('deletions', 'deletionsCount'),
        new GraphQLObjectField('url', 'publicUrl')
    ])
};
