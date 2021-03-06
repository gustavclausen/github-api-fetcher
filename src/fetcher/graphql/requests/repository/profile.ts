import _ from 'lodash';
import { Expose, Transform, plainToClass } from 'class-transformer';
import { RepositoryProfile, ProgrammingLanguage, AppliedProgrammingLanguage } from '../../../../models';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import fragments, { GITHUB_GRAPHQL_OBJECT_NAMES } from '../../common/fragments';
import { ParseError } from '../../../../lib/errors';
import { getValueForFirstKey } from '../../../../lib/object-utils';

class RepositoryProfileParseModel implements RepositoryProfile {
    @Expose()
    gitHubId!: string;

    @Expose()
    name!: string;

    @Expose()
    @Transform((obj): string => _.get(obj, 'name'))
    ownerName!: string;

    @Expose()
    description!: string;

    @Expose()
    isPrivate!: boolean;

    @Expose()
    primaryProgrammingLanguage!: ProgrammingLanguage | null;

    @Expose()
    @Transform((obj): AppliedProgrammingLanguage[] => {
        /*
         *  Data example:
            "edges": [
                {
                    "bytesCount": 73926,
                    "node": {
                        "name": "Haskell",
                        "color": "#5e5086"
                    }
                }
            ]
         */
        const rawData = _.get(obj, 'edges') as object[];

        return rawData.map(
            (curValue): AppliedProgrammingLanguage => {
                return {
                    bytesCount: _.get(curValue, 'bytesCount'),
                    name: _.get(curValue, 'node.name'),
                    color: _.get(curValue, 'node.color')
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
        /*
         * Data example:
            "nodes": [
                {
                    "topic": {
                        "name": "android"
                    }
                },
                {
                    "topic": {
                        "name": "kotlin-android"
                    }
                }
            ]
         */
        const topics = getValueForFirstKey(obj, 'nodes') as object[];

        return topics.map((curValue): string => {
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

const fragment = new GraphQLFragment('RepositoryProfile', GITHUB_GRAPHQL_OBJECT_NAMES.Repository, [
    new GraphQLObjectField('id', 'gitHubId'),
    new GraphQLObjectField('name'),
    new GraphQLObjectField('owner', 'ownerName', [new GraphQLObjectField('login', 'name')]),
    new GraphQLObjectField('description'),
    new GraphQLObjectField('isPrivate'),
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
    query = `
        query GetRepositoryProfile($ownerUsername: String!, $repositoryName: String!) {
            repository(owner: $ownerUsername, name: $repositoryName) {
                ...${fragment.name}
            }
        }

        ${fragment}
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
