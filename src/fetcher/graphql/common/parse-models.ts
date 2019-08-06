import _ from 'lodash';
import {
    RepositoryProfileMinified,
    ContributionsByRepository,
    PullRequest,
    GistProfileMinified
} from '../../../models';
import { Expose, Transform, plainToClass } from 'class-transformer';
import { getValueForFirstKey } from '../../../lib/object-utils';
import { ParseError } from '../../../lib/errors';

export class MinRepositoryProfileParseModel implements RepositoryProfileMinified {
    @Expose()
    gitHubId!: string;

    @Expose()
    name!: string;

    @Expose()
    @Transform((obj): string => _.get(obj, 'name'))
    ownerName!: string;

    @Expose()
    isPrivate!: boolean;

    @Expose()
    publicUrl!: string;
}

class ContributionsByRepositoryParseModel implements ContributionsByRepository {
    @Expose()
    @Transform(
        (obj): RepositoryProfileMinified =>
            plainToClass(MinRepositoryProfileParseModel, obj, { excludeExtraneousValues: true })
    )
    repository!: RepositoryProfileMinified;

    @Expose()
    @Transform((obj): number => _.get(obj, 'totalCount'))
    count!: number;
}

export class PullRequestParseModel implements PullRequest {
    @Expose()
    title!: string;

    @Expose()
    creationDateTime!: string;

    @Expose()
    isMerged!: boolean;

    @Expose()
    isClosed!: boolean;

    @Expose()
    additionsCount!: number;

    @Expose()
    deletionsCount!: number;

    @Expose()
    publicUrl!: string;
}

export class MinGistProfileParseModel implements GistProfileMinified {
    @Expose()
    gitHubId!: string;

    @Expose()
    gistId!: string;

    @Expose()
    @Transform((obj): string => _.get(obj, 'username'))
    ownerUsername!: string;

    @Expose()
    publicUrl!: string;
}

export const parseContributionsByRepository = (rawData: object, dataKey: string): ContributionsByRepository[] => {
    const results = getValueForFirstKey(rawData, dataKey);
    if (!results) {
        throw new ParseError(rawData);
    }

    // Parse and returns each element in response data
    return Object.values(results).map(
        (curValue): ContributionsByRepository => {
            return plainToClass(ContributionsByRepositoryParseModel, curValue, { excludeExtraneousValues: true });
        }
    );
};
