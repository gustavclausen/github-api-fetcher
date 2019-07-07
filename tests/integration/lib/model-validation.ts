import _ from 'lodash';
import { keys } from 'ts-transformer-keys';
import {
    OrganizationProfileMinified,
    RepositoryProfileMinified,
    YearlyCommitContributions,
    CommitContributionsByRepository,
    ProgrammingLanguage,
    AppliedProgrammingLanguage,
    RepositoryProfile,
    OrganizationProfile,
    UserProfile
} from '../../../src/models';

const validateOrganizationProfileMinified = (profiles: OrganizationProfileMinified[] | null): void => {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        _.forEach(keys<OrganizationProfileMinified>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });
    });
};

const validateOrganizationProfile = (profile: OrganizationProfile | null): void => {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties is set on organization profile model
    _.forEach(keys<OrganizationProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
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

const validateUserProfile = (profile: UserProfile | null): void => {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties is set on user profile model
    _.forEach(keys<UserProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
    });

    // Verify all properties set on nested 'organizationMemberships' property
    validateOrganizationProfileMinified(profile.organizationMemberships);

    // Verify all properties set on nested 'publicRepositoryOwnerships' property
    validateRepositoryProfileMinified(profile.publicRepositoryOwnerships);
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

const validateProgrammingLanguage = (pl: ProgrammingLanguage | null): void => {
    if (!pl) throw new Error('No data');

    _.forEach(keys<ProgrammingLanguage>(), (propKey): void => {
        expect(_.get(pl, propKey)).toBeDefined();
    });
};

const validateAppliedProgrammingLanguage = (apls: AppliedProgrammingLanguage[] | null): void => {
    if (!apls) throw new Error('No data');

    _.forEach(apls, (apl): void => {
        _.forEach(keys<AppliedProgrammingLanguage>(), (propKey): void => {
            expect(_.get(apl, propKey)).toBeDefined();
        });
    });
};

const validateRepositoryProfile = (profile: RepositoryProfile | null): void => {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties set on repository profile model
    _.forEach(keys<RepositoryProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
    });

    // Verify all properties set on nested 'primaryProgrammingLanguage' property
    validateProgrammingLanguage(profile.primaryProgrammingLanguage);

    // Verify all properties set on nested 'appliedProgrammingLanguages' property
    validateAppliedProgrammingLanguage(profile.appliedProgrammingLanguages);
};

export default {
    validateUserProfile,
    validateOrganizationProfileMinified,
    validateOrganizationProfile,
    validateRepositoryProfileMinified,
    validateYearlyCommitContributions,
    validateRepositoryProfile
};
