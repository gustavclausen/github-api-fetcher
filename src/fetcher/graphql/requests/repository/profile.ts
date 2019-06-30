import _ from 'lodash';
import { Expose, Transform, plainToClass } from 'class-transformer';
import { RepositoryProfile, ProgrammingLanguage, AppliedProgrammingLanguage } from '../../../../models';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GITHUB_OBJECT_NAMES, fragments } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';
import { getValueForFirstKey } from '../../../../lib/object-utils';

class RepositoryProfileParseModel implements RepositoryProfile {
    @Expose()
    gitHubId!: string;
    @Expose()
    name!: string;
    @Expose()
    @Transform((obj): string => _.get(obj, 'username'))
    ownerUsername!: string;
    @Expose()
    description!: string;
    @Expose()
    primaryProgrammingLanguage!: ProgrammingLanguage;
    @Expose()
    @Transform((obj: object): AppliedProgrammingLanguage[] => {
        const languages = _.get(obj, 'edges') as object[];
        return languages.map(
            (currentValue: object): AppliedProgrammingLanguage => {
                return {
                    bytesCount: _.get(currentValue, 'bytesCount'),
                    name: _.get(currentValue, 'node.name'),
                    color: _.get(currentValue, 'node.color')
                };
            }
        );
    })
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
    @Transform((obj): string[] => {
        const topics = getValueForFirstKey(obj, 'nodes') as object[];

        return topics.map((curValue: object): string => {
            return _.get(curValue, 'topic.name');
        });
    })
    topics!: string[];
    @Expose()
    @Transform((obj): number => _.get(obj, 'totalCount'))
    starsCount!: number;
    @Expose()
    @Transform((obj): number => _.get(obj, 'totalCount'))
    watchersCount!: number;
    @Expose()
    forkCount!: number;
}

const profileFragment = new GraphQLFragment('RepositoryProfile', GITHUB_OBJECT_NAMES.Repository, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('name'),
    new GraphQLObjectField('owner', 'ownerUsername', [new GraphQLObjectField('login', 'username')]),
    new GraphQLObjectField('description'),
    new GraphQLObjectField('primaryLanguage', 'primaryProgrammingLanguage', fragments.language.fields),
    new GraphQLObjectField(
        'languages',
        'appliedProgrammingLanguages',
        [
            new GraphQLObjectField('edges', null, [
                new GraphQLObjectField('size', 'bytesCount'),
                new GraphQLObjectField('node', null, fragments.language.fields)
            ])
        ],
        'first: 100, orderBy: {field: SIZE, direction: DESC}'
    ),
    new GraphQLObjectField('isFork'),
    new GraphQLObjectField('url', 'publicUrl'),
    new GraphQLObjectField('createdAt', 'creationDateTime'),
    new GraphQLObjectField('pushedAt', 'lastPushDateTime'),
    new GraphQLObjectField(
        'repositoryTopics',
        'topics',
        [
            new GraphQLObjectField('nodes', null, [
                new GraphQLObjectField('topic', null, [new GraphQLObjectField('name')])
            ])
        ],
        'first: 100'
    ),
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

    constructor(ownerUsername: string, repositoryName: string) {
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
