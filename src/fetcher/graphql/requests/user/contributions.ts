import GetUserCommitContributionsByRepositoryRequest from './contributions/commit-contributions-by-repository';
import GetUserContributionYearsRequest from './contributions/contribution-years';
import GetUserIssueContributionsByRepositoryRequest from './contributions/issue-contributions-by-repository';
import GetUserPullRequestContributionsByRepositoryRequest from './contributions/pull-request-contributions-by-repository';
import GetUserPullRequestReviewContributionsByRepositoryRequest from './contributions/pull-request-review-contributions-by-repository';

export default {
    CommitContributionsByRepository: GetUserCommitContributionsByRepositoryRequest,
    ContributionYears: GetUserContributionYearsRequest,
    IssueContributionsByRepository: GetUserIssueContributionsByRepositoryRequest,
    PullRequestContributionsByRepository: GetUserPullRequestContributionsByRepositoryRequest,
    PullRequestReviewContributionsByRepository: GetUserPullRequestReviewContributionsByRepositoryRequest
};
