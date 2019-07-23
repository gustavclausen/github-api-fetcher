import _ from 'lodash';
import { keys } from 'ts-transformer-keys';
import {
    OrganizationProfileMinified,
    RepositoryProfileMinified,
    ContributionsByRepository,
    ProgrammingLanguage,
    AppliedProgrammingLanguage,
    RepositoryProfile,
    OrganizationProfile,
    UserProfile,
    PullRequestContributionsByRepository,
    PullRequest,
    MonthlyContributions,
    MonthlyPullRequestContributions,
    GistProfile
} from '../../../src/models';

function validateOrganizationProfileMinified(profiles: OrganizationProfileMinified[] | null): void {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        // Verify all top-level properties is set on OrganizationProfileMinified model
        _.forEach(keys<OrganizationProfileMinified>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });
    });
}

function validateOrganizationProfile(profile: OrganizationProfile | null): void {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties is set on OrganizationProfile model
    _.forEach(keys<OrganizationProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
    });
}

function validateRepositoryProfileMinified(profiles: RepositoryProfileMinified[] | null): void {
    if (!profiles) throw new Error('No data');

    _.forEach(profiles, (profile): void => {
        // Verify all top-level properties is set on RepositoryProfileMinified model
        _.forEach(keys<RepositoryProfileMinified>(), (propKey): void => {
            expect(_.get(profile, propKey)).toBeDefined();
        });
    });
}

function validateUserProfile(profile: UserProfile | null): void {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties is set on UserProfile model
    _.forEach(keys<UserProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
    });

    // Verify all properties set on 'organizationMemberships' property
    validateOrganizationProfileMinified(profile.organizationMemberships);

    // Verify all properties set on 'publicRepositoryOwnerships' property
    validateRepositoryProfileMinified(profile.publicRepositoryOwnerships);
}

function validateContributionsByRepository(contributions: ContributionsByRepository[] | null): void {
    if (!contributions) throw new Error('No data');

    _.forEach(contributions, (contribution): void => {
        // Verify all top-level properties is set on ContributionsByRepository model
        _.forEach(keys<ContributionsByRepository>(), (propKey): void => {
            expect(_.get(contribution, propKey)).toBeDefined();
        });

        // Verify all properties set on 'repository' property
        validateRepositoryProfileMinified([contribution.repository]);
    });
}

function validateMonthlyContributions(contributions: MonthlyContributions[] | null): void {
    if (!contributions) throw new Error('No data');

    _.forEach(contributions, (contribution): void => {
        // Verify all top-level properties is set on MonthlyContributions model
        _.forEach(keys<MonthlyContributions>(), (propKey): void => {
            expect(_.get(contribution, propKey)).toBeDefined();
        });

        // Verify all properties set on 'publicContributions' property
        validateContributionsByRepository(contribution.publicContributions);
    });
}

function validateProgrammingLanguage(pl: ProgrammingLanguage | null): void {
    if (!pl) throw new Error('No data');

    // Verify all top-level properties is set on ProgrammingLanguage model
    _.forEach(keys<ProgrammingLanguage>(), (propKey): void => {
        expect(_.get(pl, propKey)).toBeDefined();
    });
}

function validateAppliedProgrammingLanguage(apls: AppliedProgrammingLanguage[] | null): void {
    if (!apls) throw new Error('No data');

    _.forEach(apls, (apl): void => {
        // Verify all top-level properties is set on AppliedProgrammingLanguage model
        _.forEach(keys<AppliedProgrammingLanguage>(), (propKey): void => {
            expect(_.get(apl, propKey)).toBeDefined();
        });
    });
}

function validateRepositoryProfile(profile: RepositoryProfile | null): void {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties set on RepositoryProfile model
    _.forEach(keys<RepositoryProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
    });

    // Expect topics array to be filled
    expect(profile.topics.length).toBeGreaterThan(0);

    // Verify all properties set on nested 'primaryProgrammingLanguage' property
    validateProgrammingLanguage(profile.primaryProgrammingLanguage);

    // Verify all properties set on nested 'appliedProgrammingLanguages' property
    validateAppliedProgrammingLanguage(profile.appliedProgrammingLanguages);
}

function validatePullRequest(prs: PullRequest[] | null): void {
    if (!prs) throw new Error('No data');

    _.forEach(prs, (pr): void => {
        // Verify all top-level properties set on PullRequest model
        _.forEach(keys<PullRequest>(), (propKey): void => {
            expect(_.get(pr, propKey)).toBeDefined();
        });
    });
}

function validatePullRequestContributionsByRepository(prcs: PullRequestContributionsByRepository[] | null): void {
    if (!prcs) throw new Error('No data');

    _.forEach(prcs, (prc): void => {
        // Verify all top-level properties set on PullRequestContributionsByRepository model
        _.forEach(keys<PullRequestContributionsByRepository>(), (propKey): void => {
            expect(_.get(prc, propKey)).toBeDefined();
        });

        // Verify all properties set on nested 'repository' property
        validateRepositoryProfileMinified([prc.repository]);

        // Verify all properties set on nested 'pullRequestContributions' property
        validatePullRequest(prc.pullRequestContributions);
    });
}

function validateMonthlyPullRequestContributions(prcs: MonthlyPullRequestContributions[] | null): void {
    if (!prcs) throw new Error('No data');

    _.forEach(prcs, (prc): void => {
        // Verify all top-level properties set on MonthlyPullRequestContributions model
        _.forEach(keys<MonthlyPullRequestContributions>(), (propKey): void => {
            expect(_.get(prc, propKey)).toBeDefined();
        });

        // Verify all properties set on nested 'publicPullRequestContributions' property
        validatePullRequestContributionsByRepository(prc.publicPullRequestContributions);
    });
}

function validateGistProfile(profile: GistProfile | null): void {
    if (!profile) throw new Error('No data');

    // Verify all top-level properties set on GistProfile model
    _.forEach(keys<GistProfile>(), (propKey): void => {
        expect(_.get(profile, propKey)).toBeDefined();
    });

    // Verify all properties set on nested 'files' property
    validateAppliedProgrammingLanguage(profile.files);
}

export default {
    validateUserProfile,
    validateOrganizationProfileMinified,
    validateOrganizationProfile,
    validateRepositoryProfileMinified,
    validateMonthlyContributions,
    validateRepositoryProfile,
    validateMonthlyPullRequestContributions,
    validateGistProfile
};
