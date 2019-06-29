import _ from 'lodash';
import { Expose, plainToClass } from 'class-transformer';
import { RepositoryProfile, ProgrammingLanguage, AppliedProgrammingLanguage } from '../../../../models';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_OBJECT_NAMES, fragments } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';

class RepositoryProfileParseModel implements RepositoryProfile {
    @Expose()
    gitHubId!: string;
    @Expose()
    name!: string;
    @Expose()
    ownerUsername!: string;
    @Expose()
    description!: string;
    @Expose()
    primaryProgrammingLanguage!: ProgrammingLanguage;
    @Expose()
    appliedProgrammingLanguages!: AppliedProgrammingLanguage[];
    @Expose()
    isFork!: boolean;
    @Expose()
    publicUrl!: string;
    @Expose()
    creationDateTime!: Date;
    @Expose()
    lastPushDateTime!: Date;
    @Expose()
    topics!: string[];
    @Expose()
    starsCount!: number;
    @Expose()
    watchersCount!: number;
    @Expose()
    forkCount!: number;
}

const profileFragment = new GraphQLFragment('OrganizationProfile', GITHUB_OBJECT_NAMES.Organization, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('name'),
    new GraphQLObjectField('owner', 'ownerUsername', [new GraphQLObjectField('login', 'username')]),
    new GraphQLObjectField('description'),
    new GraphQLObjectField('primaryLanguage', 'primaryProgrammingLanguage', fragments.language.fields),
    new GraphQLObjectField('languages', 'appliedProgrammingLanguages', [
        new GraphQLObjectField('edges', null, [
            new GraphQLObjectField('size', null),
            new GraphQLObjectField('nodes', null, fragments.language.fields)
        ])
    ]), // TODO: Add variables to GraphQLObjectField
    new GraphQLObjectField('isFork'),
    new GraphQLObjectField('url', 'publicUrl'),
    new GraphQLObjectField('createdAt', 'creationDateTime'),
    new GraphQLObjectField('pushedAt', 'lastPushDateTime'),
    new GraphQLObjectField('repositoryTopics', 'topics', [
        new GraphQLObjectField('nodes', null, [new GraphQLObjectField('topic', null, [new GraphQLObjectField('name')])])
    ]), // TODO: Add variables to GraphQLObjectField
    new GraphQLObjectField('stargazers', 'starsCount', [new GraphQLObjectField('totalCount')]),
    new GraphQLObjectField('watchers', 'watchersCount', [new GraphQLObjectField('totalCount')]),
    new GraphQLObjectField('forkCount')
]);

export default class GetRepositoryProfileRequest implements GraphQLRequest<RepositoryProfile> {
    fragment = profileFragment;
    query = `
        query GetRepositoryProfile($ownerUsername: String!, $repositoryName: String!) {
            repository(owner: $ownerUsername, name: $repositoryName) {
                ...${this.fragment.name}
            }
        }

        ${this.fragment}
    `;
    variables: object | undefined;

    constructor(repositoryName: string, ownerUsername: string) {
        this.variables = {
            repositoryName: repositoryName,
            ownerUsername: ownerUsername
        };
    }

    parseResponse(rawData: object): RepositoryProfile {
        const repositoryProfileData = _.get(rawData, 'repository');
        if (!repositoryProfileData) {
            throw new ParseError(rawData);
        }

        return plainToClass(RepositoryProfileParseModel, repositoryProfileData, { excludeExtraneousValues: true });
    }
}
