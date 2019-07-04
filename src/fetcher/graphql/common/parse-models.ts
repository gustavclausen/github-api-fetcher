import _ from 'lodash';
import { RepositoryProfileMinified } from '../../../models';
import { Expose, Transform } from 'class-transformer';

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
