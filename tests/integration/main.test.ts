/* eslint-disable @typescript-eslint/no-non-null-assertion */
import _ from 'lodash';
import APIFetcher from '../../src/main';
import randomData from './lib/random-data';
import modelValidation from './lib/model-validation';
import { UserProfile } from '../../src/models';

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeAll((): void => {
        fetcher = new APIFetcher();
    });

    describe('user', (): void => {
        let userProfile: UserProfile;
        let nonExistingUsername: string;

        beforeAll(async (): Promise<void> => {
            // Find eligible user profile with at least one organization membership
            let result: UserProfile | null = null;
            while (!result || _.isEmpty(result.organizationMemberships)) {
                const randomUsername = await randomData.getUsernameOfRandomUser();
                result = await fetcher.user.getProfile(randomUsername);
            }
            userProfile = result;

            // Find non-existing username
            nonExistingUsername = await randomData.getUsernameOfNonExistingUser();
        }, 30000); // Tries for 30 seconds, and fails with error if timeout is exceeded

        describe('getProfile', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                modelValidation.validateUserProfile(userProfile);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getProfile(nonExistingUsername)).toBeNull();
            });
        });

        describe('getOrganizationMemberships', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                const result = await fetcher.user.getOrganizationMemberships(userProfile.username);

                modelValidation.validateOrganizationProfileMinified(result);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getOrganizationMemberships(nonExistingUsername)).toBeNull();
            });
        });

        describe('getPublicRepositoryOwnerships', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                const result = await fetcher.user.getPublicRepositoryOwnerships(userProfile.username);

                modelValidation.validateRepositoryProfileMinified(result);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getPublicRepositoryOwnerships(nonExistingUsername)).toBeNull();
            });
        });

        describe('getContributionYears', (): void => {
            it('should return number array', async (): Promise<void> => {
                const result = await fetcher.user.getContributionYears(userProfile.username);

                expect(Array.isArray(result)).toBe(true);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getContributionYears(nonExistingUsername)).toBeNull();
            });
        });

        describe('getAllCommitContributions', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                const result = await fetcher.user.getAllCommitContributions(userProfile.username);

                modelValidation.validateYearlyCommitContributions(result);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getAllCommitContributions(nonExistingUsername)).toBeNull();
            });
        });

        describe('getCommitContributionsByYear', (): void => {
            let userContributionYears: number[];

            beforeAll(
                async (): Promise<void> => {
                    userContributionYears = (await fetcher.user.getContributionYears(userProfile.username))!;
                }
            );

            it('should return model with all properties set', async (): Promise<void> => {
                // Get contribution from random year in which user has done some contributions
                const randomContributionYear = _.sample(userContributionYears)!;

                const result = (await fetcher.user.getCommitContributionsByYear(
                    userProfile.username,
                    randomContributionYear
                ))!;

                modelValidation.validateYearlyCommitContributions([result]);
            });

            it('should return default object when user has done no contributions in year', async (): Promise<void> => {
                let nonContributionYear = _.min(userContributionYears)! - 1;

                const result = (await fetcher.user.getCommitContributionsByYear(
                    userProfile.username,
                    nonContributionYear
                ))!;

                expect(result).toMatchObject({
                    year: nonContributionYear,
                    privateCommitCount: 0,
                    publicContributions: []
                });
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getAllCommitContributions(nonExistingUsername)).toBeNull();
            });
        });
    });

    describe('organization', (): void => {
        describe('getProfile', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                const randomOrganizationName = await randomData.getNameOfRandomOrganization();
                const result = await fetcher.organization.getProfile(randomOrganizationName);

                modelValidation.validateOrganizationProfile(result);
            });

            it('should return null for non-existing organization', async (): Promise<void> => {
                const randomOrganizationName = await randomData.getNameOfNonExistingOrganization();

                expect(await fetcher.organization.getProfile(randomOrganizationName)).toBeNull();
            });
        });
    });

    describe('repository', (): void => {
        describe('getProfile', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                const [randomRepoOwnerUsername, randomRepoName] = await randomData.getRandomRepository();
                const result = await fetcher.repository.getProfile(randomRepoOwnerUsername, randomRepoName);

                modelValidation.validateRepositoryProfile(result);
            });

            it('should return null for non-existing repository', async (): Promise<void> => {
                const [nonExistingRepoOwnerUsername, nonExistingRepoName] = await randomData.getNonExistingRepository();

                expect(
                    await fetcher.repository.getProfile(nonExistingRepoOwnerUsername, nonExistingRepoName)
                ).toBeNull();
            });
        });
    });
});
