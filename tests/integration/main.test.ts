/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import _ from 'lodash';
import uuid = require('uuid');
import { APIFetcher } from '../../src/main';
import randomData from './lib/random-data';
import modelValidation from './lib/model-validation';
import { UserProfile, OrganizationProfileMinified } from '../../src/models';
import { Month } from '../../src/lib/date-utils';

jest.setTimeout(60000); // 60 seconds timeout for all tests and before/after hooks. Tests fails with error if timeout is exceeded

describe('APIFetcher', (): void => {
    let fetcher: APIFetcher;

    beforeAll((): void => {
        fetcher = new APIFetcher(); // NOTE: Access token is loaded from environment variables
    });

    describe('user', (): void => {
        let userProfile: UserProfile;
        let usersContributionYears: number[];
        let randomContributionYearOfUser: number;
        let nonExistingUsername: string;

        beforeAll(
            async (): Promise<void> => {
                // Find eligible user profile with at least one organization membership
                let result: UserProfile | null = null;
                let randomUserOrganizationMemberships: OrganizationProfileMinified[] = [];

                while (!result || _.isEmpty(randomUserOrganizationMemberships)) {
                    const randomUsername = await randomData.getUsernameOfRandomUser();
                    result = await fetcher.user.getProfile(randomUsername);
                    randomUserOrganizationMemberships = (await fetcher.user.getOrganizationMemberships(
                        randomUsername
                    ))!;
                }

                userProfile = result;
                usersContributionYears = (await fetcher.user.getContributionYears(userProfile.username))!;
                // Get random year in which user has done some contributions
                randomContributionYearOfUser = _.sample(usersContributionYears)!;

                // Find non-existing username
                nonExistingUsername = await randomData.getUsernameOfNonExistingUser();
            }
        );

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

        describe('getPublicGists', (): void => {
            it('should return model with all properties set', async (): Promise<void> => {
                const result = await fetcher.user.getPublicGists(userProfile.username);

                modelValidation.validateMinGistProfile(result);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getPublicGists(nonExistingUsername)).toBeNull();
            });
        });

        describe('getContributionYears', (): void => {
            it('should return number array', async (): Promise<void> => {
                const result = (await fetcher.user.getContributionYears(userProfile.username))!;

                expect(Array.isArray(result)).toBe(true);
                // Expect array to be filled. Found user will have contributed for one or more years.
                expect(result.length).toBeGreaterThan(0);
            });

            it('should return null for non-existing user', async (): Promise<void> => {
                expect(await fetcher.user.getContributionYears(nonExistingUsername)).toBeNull();
            });
        });

        describe('Commit contributions', (): void => {
            // Random time in which user has contributed with a commit
            let [commitContributionYear, commitContributionMonth]: [number, Month] = [0, 0];

            beforeAll(
                async (): Promise<void> => {
                    [
                        commitContributionYear,
                        commitContributionMonth
                    ] = (await randomData.getRandomCommitContributionTime(userProfile.username))!;
                }
            );

            describe('getCommitContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getCommitContributionsInMonth(
                        userProfile.username,
                        commitContributionYear,
                        commitContributionMonth
                    ))!;

                    modelValidation.validateMonthlyContributions([result]);
                });

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
                });

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getCommitContributionsInMonth(nonExistingUsername, 2010, Month.JANUARY)
                    ).toBeNull();
                });
            });

            describe('getCommitContributionsInYear', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getCommitContributionsInYear(
                        userProfile.username,
                        commitContributionYear
                    ))!;

                    modelValidation.validateMonthlyContributions(result);
                });

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getCommitContributionsInYear(
                            nonExistingUsername,
                            randomContributionYearOfUser
                        )
                    ).toBeNull();
                });
            });
        });

        describe('Issue contributions', (): void => {
            // Random time in which user has contributed with an issue
            let [issueContributionYear, issueContributionMonth]: [number, Month] = [0, 0];

            beforeAll(
                async (): Promise<void> => {
                    [issueContributionYear, issueContributionMonth] = (await randomData.getRandomIssueContributionTime(
                        userProfile.username
                    ))!;
                }
            );

            describe('getIssueContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getIssueContributionsInMonth(
                        userProfile.username,
                        issueContributionYear,
                        issueContributionMonth
                    ))!;

                    modelValidation.validateMonthlyContributions([result]);
                });

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
                });

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
                        issueContributionYear
                    ))!;

                    modelValidation.validateMonthlyContributions(result);
                });

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getIssueContributionsInYear(
                            nonExistingUsername,
                            randomContributionYearOfUser
                        )
                    ).toBeNull();
                });
            });
        });

        describe('Pull request review contributions', (): void => {
            // Random time in which user has contributed with a PR review
            let [PRReviewContributionYear, PRReviewContributionMonth]: [number, Month] = [0, 0];

            beforeAll(
                async (): Promise<void> => {
                    [
                        PRReviewContributionYear,
                        PRReviewContributionMonth
                    ] = (await randomData.getRandomPRReviewContributionTime(userProfile.username))!;
                }
            );

            describe('getPullRequestReviewContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getPullRequestReviewContributionsInMonth(
                        userProfile.username,
                        PRReviewContributionYear,
                        PRReviewContributionMonth
                    ))!;

                    modelValidation.validateMonthlyContributions([result]);
                });

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
                });

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
                        PRReviewContributionYear
                    ))!;

                    modelValidation.validateMonthlyContributions(result);
                });

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getPullRequestReviewContributionsInYear(
                            nonExistingUsername,
                            randomContributionYearOfUser
                        )
                    ).toBeNull();
                });
            });
        });

        describe('Pull request contributions', (): void => {
            // Random time in which user has contributed with a PR
            let [PRContributionYear, PRContributionMonth]: [number, Month] = [0, 0];

            beforeAll(
                async (): Promise<void> => {
                    [PRContributionYear, PRContributionMonth] = (await randomData.getRandomPRContributionTime(
                        userProfile.username
                    ))!;
                }
            );

            describe('getPullRequestContributionsInMonth', (): void => {
                it('should return model with all properties set', async (): Promise<void> => {
                    const result = (await fetcher.user.getPullRequestContributionsInMonth(
                        userProfile.username,
                        PRContributionYear,
                        PRContributionMonth
                    ))!;

                    modelValidation.validateMonthlyPullRequestContributions([result]);
                });

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
                });

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
                        PRContributionYear
                    ))!;

                    modelValidation.validateMonthlyPullRequestContributions(result);
                });

                it('should return null for non-existing user', async (): Promise<void> => {
                    expect(
                        await fetcher.user.getPullRequestContributionsInYear(
                            nonExistingUsername,
                            randomContributionYearOfUser
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
                const nonExistingOrganizationName = await randomData.getNameOfNonExistingOrganization();

                expect(await fetcher.organization.getProfile(nonExistingOrganizationName)).toBeNull();
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

    describe('gist', (): void => {
        describe('getProfile', (): void => {
            let [randomGistOwnerUsername, randomGistId]: [string, string] = ['', ''];

            beforeAll(
                async (): Promise<void> => {
                    [randomGistOwnerUsername, randomGistId] = await randomData.getRandomGist();
                }
            );

            it('should return model with all properties set', async (): Promise<void> => {
                const result = await fetcher.gist.getProfile(randomGistOwnerUsername, randomGistId);

                modelValidation.validateGistProfile(result);
            });

            it('should return null for non-existing gist created by non-existing user', async (): Promise<void> => {
                const [nonExistingOwnerUsername, nonExistingGistId] = await randomData.getNonExistingGist();

                expect(await fetcher.gist.getProfile(nonExistingOwnerUsername, nonExistingGistId)).toBeNull();
            });

            it('should return null for non-existing gist created by existing user', async (): Promise<void> => {
                expect(await fetcher.gist.getProfile(randomGistId, uuid())).toBeNull();
            });
        });
    });
});
