import _ from 'lodash';
import { keys } from 'ts-transformer-keys';
import {
    OrganizationProfileMinified,
    RepositoryProfileMinified,
    YearlyCommitContributions,
    CommitContributionsByRepository
} from '../../../src/models';

const validateOrganizationProfileMinified = (profiles: OrganizationProfileMinified[] | null): void => {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        _.forEach(keys<OrganizationProfileMinified>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });
    });
};

const validateRepositoryProfileMinified = (profiles: RepositoryProfileMinified[] | null): void => {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        _.forEach(keys<RepositoryProfileMinified>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });
    });
};

const validateCommitContributionsByRepository = (profiles: CommitContributionsByRepository[] | null): void => {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        _.forEach(keys<CommitContributionsByRepository>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });

        // Verify all properties set on nested 'repository' property
        validateRepositoryProfileMinified([profile.repository]);
    });
};

const validateYearlyCommitContributions = (profiles: YearlyCommitContributions[] | null): void => {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        _.forEach(keys<YearlyCommitContributions>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });

        // Verify all properties set on nested 'publicContributions' property
        validateCommitContributionsByRepository(profile.publicContributions);
    });
};

export default {
    validateOrganizationProfileMinified,
    validateRepositoryProfileMinified,
    validateCommitContributionsByRepository,
    validateYearlyCommitContributions
};
