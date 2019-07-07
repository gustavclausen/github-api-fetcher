import _ from 'lodash';
import APIFetcher from '../../src/main';
import { keys } from 'ts-transformer-keys';
import randomData from './lib/random-data';
import {
    UserProfile,
    OrganizationProfile,
    RepositoryProfileMinified,
    OrganizationProfileMinified,
    RepositoryProfile,
    ProgrammingLanguage,
    AppliedProgrammingLanguage
} from '../../src/models';

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeEach((): void => {
        fetcher = new APIFetcher();
    });

    describe('user', (): void => {
        it('getProfile should return model with all properties set', async (): Promise<void> => {
            let randomUsername = await randomData.getUsernameOfRandomUser();
            let result = await fetcher.user.getProfile(randomUsername);

            // Search for user with at least one organization membership
            while (result && _.isEmpty(result.organizationMemberships)) {
                randomUsername = await randomData.getUsernameOfRandomUser();
                result = await fetcher.user.getProfile(randomUsername);
            }

            if (!result) {
                throw new Error('No data to test on');
            }

            // Verify all top-level properties is set on user profile model
            _.forEach(keys<UserProfile>(), (propKey): void => {
                expect(_.get(result, propKey)).toBeDefined();
            });

            // Verify all properties set on nested 'organizationMemberships' property
            _.forEach(result.organizationMemberships, (organization): void => {
                _.forEach(keys<OrganizationProfileMinified>(), (propKey): void => {
                    expect(_.get(organization, propKey)).toBeDefined();
                });
            });

            // Verify all properties set on nested 'publicRepositoryOwnerships' property
            _.forEach(result.publicRepositoryOwnerships, (repository): void => {
                _.forEach(keys<RepositoryProfileMinified>(), (propKey): void => {
                    expect(_.get(repository, propKey)).toBeDefined();
                });
            });
        }, 30000);
    });

    describe('organization', (): void => {
        it('getProfile should return model with all properties set', async (): Promise<void> => {
            const randomOrganizationName = await randomData.getNameOfRandomOrganization();
            const result = await fetcher.organization.getProfile(randomOrganizationName);

            // Verify all top-level properties is set on organization profile model
            _.forEach(keys<OrganizationProfile>(), (propKey): void => {
                expect(_.get(result, propKey)).toBeDefined();
            });
        });
    });

    describe('repository', (): void => {
        it('getProfile should return model with all properties set', async (): Promise<void> => {
            const [randomRepoOwnerUsername, randomRepoName] = await randomData.getRandomRepository();
            const result = await fetcher.repository.getProfile(randomRepoOwnerUsername, randomRepoName);

            if (!result) {
                throw new Error('No data to test on');
            }

            // Verify all properties set on repository profile model
            _.forEach(keys<RepositoryProfile>(), (propKey): void => {
                expect(_.get(result, propKey)).toBeDefined();
            });

            // Verify all properties set on nested 'primaryProgrammingLanguage' property
            _.forEach(keys<ProgrammingLanguage>(), (propKey): void => {
                expect(_.get(result.primaryProgrammingLanguage, propKey)).toBeDefined();
            });

            // Verify all properties set on nested 'appliedProgrammingLanguages' property
            _.forEach(result.appliedProgrammingLanguages, (programmingLanguage): void => {
                _.forEach(keys<AppliedProgrammingLanguage>(), (propKey): void => {
                    expect(_.get(programmingLanguage, propKey)).toBeDefined();
                });
            });
        });
    });
});
