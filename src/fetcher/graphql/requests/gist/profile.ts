import _ from 'lodash';
import { GraphQLRequest, GraphQLFragment, GraphQLObjectField } from '../../utils';
import { GistProfile, AppliedProgrammingLanguage } from '../../../../models';
import { RequestError, ResponseErrorType } from '../../../../lib/errors';
import { plainToClass, Expose, Transform } from 'class-transformer';
import fragments, { GITHUB_GRAPHQL_OBJECT_NAMES } from '../../common/fragments';
import { MinGistProfileParseModel } from '../../common/parse-models';

class GistProfileParseModel extends MinGistProfileParseModel implements GistProfile {
    @Expose()
    publicUrl!: string;

    @Expose()
    description!: string;

    @Expose()
    isFork!: boolean;

    @Expose()
    creationDateTime!: Date;

    @Expose()
    lastPushDateTime!: Date;

    @Expose()
    @Transform((obj): number => _.get(obj, 'count'))
    forksCount!: number;

    @Expose()
    @Transform((obj): number => _.get(obj, 'count'))
    starsCount!: number;

    @Expose()
    @Transform((obj: object[]): AppliedProgrammingLanguage[] => {
        // Only collect files where programming language is set (e.g. images and other assets is filtered out)
        return _.reduce(
            obj,
            (acc, curValue): AppliedProgrammingLanguage[] => {
                const languageName = _.get(curValue, 'language.name');
                if (!languageName) return acc;

                return [
                    ...acc,
                    {
                        name: languageName,
                        color: null,
                        bytesCount: _.get(curValue, 'bytesCount')
                    }
                ];
            },
            [] as AppliedProgrammingLanguage[]
        );
    })
    files!: AppliedProgrammingLanguage[];

    @Expose()
    @Transform((obj): number => _.get(obj, 'count'))
    commentsCount!: number;
}

const fragment = new GraphQLFragment('GistProfile', GITHUB_GRAPHQL_OBJECT_NAMES.Gist, [
    ...fragments.minifiedGist.fields,
    new GraphQLObjectField('description'),
    new GraphQLObjectField('isFork'),
    new GraphQLObjectField('createdAt', 'creationDateTime'),
    new GraphQLObjectField('pushedAt', 'lastPushDateTime'),
    new GraphQLObjectField('forks', 'forksCount', [new GraphQLObjectField('totalCount', 'count')]),
    new GraphQLObjectField('stargazers', 'starsCount', [new GraphQLObjectField('totalCount', 'count')]),
    new GraphQLObjectField('files', null, [
        new GraphQLObjectField('language', null, [new GraphQLObjectField('name')]),
        new GraphQLObjectField('size', 'bytesCount')
    ]),
    new GraphQLObjectField('comments', 'commentsCount', [new GraphQLObjectField('totalCount', 'count')])
]);

export default class GetGistProfileRequest implements GraphQLRequest<GistProfile> {
    query = `
        query GetGistProfile($ownerUsername: String!, $gistId: String!) {
            user(login: $ownerUsername) {
                gist(name: $gistId) {
                    ...${fragment.name}
                }
            }
        }

        ${fragment}
    `;
    variables: object | undefined;

    constructor(ownerUsername: string, gistId: string) {
        this.variables = {
            ownerUsername,
            gistId
        };
    }

    parseResponse(rawData: object): GistProfile {
        const gistProfileData = _.get(rawData, 'user.gist');
        if (!gistProfileData) {
            throw new RequestError(ResponseErrorType.NOT_FOUND, 'No data found');
        }

        return plainToClass(GistProfileParseModel, gistProfileData, {
            excludeExtraneousValues: true
        });
    }
}
