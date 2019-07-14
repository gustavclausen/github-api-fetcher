/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import _ from 'lodash';
import APIFetcher from '../../src/main';
import randomData from './lib/random-data';
import modelValidation from './lib/model-validation';
import { UserProfile } from '../../src/models';
import { Month } from '../../src/lib/date-utils';

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeAll((): void => {
        fetcher = new APIFetcher();
    });

    describe('user', (): void => {
        let userProfile: UserProfile;
        let userContributionYears: number[];
        let randomContributionYear: number;
        let nonExistingUsername: string;

        beforeAll(async (): Promise<void> => {
            // Find eligible user profile with at least one organization membership
            let result: UserProfile | null = null;

            while (!result || _.isEmpty(result.organizationMemberships)) {
                const randomUsername = await randomData.getUsernameOfRandomUser();
                result = await fetcher.user.getProfile(randomUsername);
            }

            userProfile = result;
            userContributionYears = (await fetcher.user.getContributionYears(userProfile.username))!;
            // Get contribution from random year in which user has done some contributions
            randomContributionYear = _.sample(userContributionYears)!;

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

        describe('Commit contributions', (): void => {
            let randomCommitContributionTime: [number, Month]; // [year, month]

            beforeAll(
                async (): Promise<void> => {
                    randomCommitContributionTime = await randomData.getRandomCommitContributionTime(
                        userProfile.username
                    );
                }
            );

            describe('getCommitContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getCommitContributionsInMonth(
                        userProfile.username,
                        randomCommitContributionTime[0], // Year
                        randomCommitContributionTime[1] // Month
                    ))!;

                    modelValidation.validateMonthlyContributions([result]);
                }, 10000);

                it('should return default object when user has done no contributions in month', async (): Promise<
                    void
                > => {
                    let nonContributionYear = 2000;
                    let nonContributionMonth = Month.JANUARY;

                    const result = (await fetcher.user.getCommitContributionsInMonth(
                        userProfile.username,
                        nonContributionYear,
                        nonContributionMonth
                    ))!;

                    expect(result).toMatchObject({
                        month: Month[nonContributionMonth],
                        privateContributionsCount: 0,
                        publicContributions: []
                    });
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getCommitContributionsInMonth(nonExistingUsername, 2010, Month.JANUARY)
                    ).toBeNull();
                }, 10000);
            });

            describe('getCommitContributionsInYear', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getCommitContributionsInYear(
                        userProfile.username,
                        randomCommitContributionTime[1] // Year
                    ))!;

                    modelValidation.validateMonthlyContributions(result);
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getCommitContributionsInYear(nonExistingUsername, randomContributionYear)
                    ).toBeNull();
                });
            });
        });

        describe('Issue contributions', (): void => {
            let randomIssueContributionTime: [number, Month]; // [year, month]

            beforeAll(
                async (): Promise<void> => {
                    randomIssueContributionTime = await randomData.getRandomIssueContributionTime(userProfile.username);
                }
            );

            describe('getIssueContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getIssueContributionsInMonth(
                        userProfile.username,
                        randomIssueContributionTime[0], // Year
                        randomIssueContributionTime[1] // Month
                    ))!;

                    modelValidation.validateMonthlyContributions([result]);
                }, 10000);

                it('should return default object when user has done no contributions in month', async (): Promise<
                    void
                > => {
                    let nonContributionYear = 2000;
                    let nonContributionMonth = Month.JANUARY;

                    const result = (await fetcher.user.getIssueContributionsInMonth(
                        userProfile.username,
                        nonContributionYear,
                        nonContributionMonth
                    ))!;

                    expect(result).toMatchObject({
                        month: Month[nonContributionMonth],
                        privateContributionsCount: 0,
                        publicContributions: []
                    });
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getCommitContributionsInMonth(nonExistingUsername, 2000, Month.JANUARY)
                    ).toBeNull();
                });
            });

            describe('getIssueContributionsInYear', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getIssueContributionsInYear(
                        userProfile.username,
                        randomIssueContributionTime[1] // Year
                    ))!;

                    modelValidation.validateMonthlyContributions(result);
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getIssueContributionsInYear(nonExistingUsername, randomContributionYear)
                    ).toBeNull();
                });
            });
        });

        describe('Pull request review contributions', (): void => {
            let randomPRReviewContributionTime: [number, Month]; // [year, month]

            beforeAll(
                async (): Promise<void> => {
                    randomPRReviewContributionTime = await randomData.getRandomPRReviewContributionTime(
                        userProfile.username
                    );
                }
            );

            describe('getPullRequestReviewContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getPullRequestReviewContributionsInMonth(
                        userProfile.username,
                        randomPRReviewContributionTime[0], // Year
                        randomPRReviewContributionTime[1] // Month
                    ))!;

                    modelValidation.validateMonthlyContributions([result]);
                }, 10000);

                it('should return default object when user has done no contributions in month', async (): Promise<
                    void
                > => {
                    let nonContributionYear = 2000;
                    let nonContributionMonth = Month.JANUARY;

                    const result = (await fetcher.user.getPullRequestReviewContributionsInMonth(
                        userProfile.username,
                        nonContributionYear,
                        nonContributionMonth
                    ))!;

                    expect(result).toMatchObject({
                        month: Month[nonContributionMonth],
                        privateContributionsCount: 0,
                        publicContributions: []
                    });
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getPullRequestReviewContributionsInMonth(
                            nonExistingUsername,
                            2000,
                            Month.JANUARY
                        )
                    ).toBeNull();
                });
            });

            describe('getPullRequestReviewsContributionsInYear', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getPullRequestReviewContributionsInYear(
                        userProfile.username,
                        randomPRReviewContributionTime[1] // Year
                    ))!;

                    modelValidation.validateMonthlyContributions(result);
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getPullRequestReviewContributionsInYear(
                            nonExistingUsername,
                            randomContributionYear
                        )
                    ).toBeNull();
                });
            });
        });

        describe('Pull request contributions', (): void => {
            let randomPRContributionTime: [number, Month]; // [year, month]

            beforeAll(
                async (): Promise<void> => {
                    randomPRContributionTime = await randomData.getRandomPRContributionTime(userProfile.username);
                }
            );

            describe('getPullRequestContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getPullRequestContributionsInMonth(
                        userProfile.username,
                        randomPRContributionTime[0], // Year
                        randomPRContributionTime[1] // Month
                    ))!;

                    modelValidation.validateMonthlyPullRequestContributions([result]);
                }, 10000);

                it('should return default object when user has done no contributions in month', async (): Promise<
                    void
                > => {
                    let nonContributionYear = 2000;
                    let nonContributionMonth = Month.JANUARY;

                    const result = (await fetcher.user.getPullRequestContributionsInMonth(
                        userProfile.username,
                        nonContributionYear,
                        nonContributionMonth
                    ))!;

                    expect(result).toMatchObject({
                        month: Month[nonContributionMonth],
                        privatePullRequestContributionsCount: 0,
                        publicPullRequestContributions: []
                    });
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getPullRequestContributionsInMonth(nonExistingUsername, 2000, Month.JANUARY)
                    ).toBeNull();
                });
            });

            describe('getPullRequestContributionsInYear', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getPullRequestContributionsInYear(
                        userProfile.username,
                        randomPRContributionTime[1] // Year
                    ))!;

                    modelValidation.validateMonthlyPullRequestContributions(result);
                }, 10000);

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getPullRequestContributionsInYear(
                            nonExistingUsername,
                            randomContributionYear
                        )
                    ).toBeNull();
                });
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
