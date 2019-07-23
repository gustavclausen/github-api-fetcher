/**
 * Public profile of GitHub user
 */
export interface UserProfile {
    /**
     * GitHub's own id for user
     */
    gitHubId: string;
    /**
     * Username of user
     */
    username: string;
    /**
     * Name of the public profile (most often the real name of the person)
     */
    displayName: string;
    /**
     * Name of company that the user works for. Can be annoted as
     * '@<company name>' (mentioning name of the company's organization on GitHub) or
     * '<company name>' (just plain text).
     */
    company: string;
    /**
     * The URL pointing to the profile on GitHub – e.g. 'https://github.com/torvalds'
     */
    publicUrl: string;
    /**
     * When the profile was created on GitHub
     */
    creationDateTime: Date;
    /**
     * The URL pointing to the profile's avatar (image) on GitHub – e.g. 'https://avatars0.githubusercontent.com/u/1024025?s=460&v=4'
     */
    avatarUrl: string;
    /**
     * Indicates if the user is available for hire
     */
    forHire: boolean;
    /**
     * Number of users following this profile
     */
    followersCount: number;
    /**
     * Organizations that the user is member of
     */
    organizationMemberships: OrganizationProfileMinified[];
    /**
     * The user's own public repositories
     */
    publicRepositoryOwnerships: RepositoryProfileMinified[];
    /**
     * The user's own public gists
     */
    publicGists: GistProfileMinified[];
}

/**
 * Minified model used to reference OrganizationProfile which contains more details
 * about organization
 */
export interface OrganizationProfileMinified {
    /**
     * GitHub's own id for organization
     */
    gitHubId: string;
    /**
     * Name of the organization. Equivalent to the username of a user profile
     */
    name: string;
    /**
     * The URL pointing to the profile on GitHub – e.g. 'https://github.com/github'
     */
    publicUrl: string;
}

/**
 * Public profile of a GitHub organization
 */
export interface OrganizationProfile extends OrganizationProfileMinified {
    /**
     * Name of the public profile (most often the real name of the organization)
     */
    displayName: string;
    /**
     * Description of the organization
     */
    description: string;
    /**
     * The URL pointing to the profile's avatar (image) on GitHub – e.g. 'https://avatars1.githubusercontent.com/u/9919?s=200&v=4'
     */
    avatarUrl: string;
    /**
     * Number of members (i.e. users) that is member of the organization
     */
    membersCount: number;
}

/**
 * Describes a programming language
 */
export interface ProgrammingLanguage {
    /**
     * Name of the programming language – e.g. 'Haskell'
     */
    name: string;
    /**
     * GitHub's color code (i.e. hex-value) for the programming language – e.g. '#5e5086'
     */
    color: string | null;
}

/**
 * Describes a used programming language for code in a repository
 */
export interface AppliedProgrammingLanguage extends ProgrammingLanguage {
    /**
     * The number of bytes of code written in the specific programming language
     */
    bytesCount: number;
}

/**
 * Minified model used to reference RepositoryProfile which contains more details
 */
export interface RepositoryProfileMinified {
    /**
     * GitHub's own id for repository
     */
    gitHubId: string;
    /**
     * Name of the repository – e.g. 'linux'
     */
    name: string;
    /**
     * Name of the owner of the repository – that can either be the username of a user,
     * or the name of a organization
     */
    ownerName: string;
    /**
     * The URL pointing to the repository on GitHub – e.g. 'https://github.com/torvalds/linux'
     */
    publicUrl: string;
    /**
     * Indicates if repository is private
     */
    isPrivate: boolean;
}

/**
 * Public profile of a GitHub repository
 */
export interface RepositoryProfile extends RepositoryProfileMinified {
    /**
     * Description of the repository
     */
    description: string;
    /**
     * The primary used programming language of the repository's code.
     * Is null if repository does not contain any source code.
     */
    primaryProgrammingLanguage: ProgrammingLanguage | null;
    /**
     * A list containing a breakdown of the programming language composition
     * of the repository's code
     */
    appliedProgrammingLanguages: AppliedProgrammingLanguage[];
    /**
     * Indicates if the repository is forked
     */
    isFork: boolean;
    /**
     * When the repository was created on GitHub
     */
    creationDateTime: Date;
    /**
     * The last time a commit was pushed to the repository
     */
    lastPushDateTime: Date;
    /**
     * A list of the repository's topics
     */
    topics: string[];
    /**
     * Number of users who have starred the repository
     */
    starsCount: number;
    /**
     * Number of users who is watching the repository
     */
    watchersCount: number;
    /**
     * Number of direct forked repositories
     */
    forkCount: number;
}

/**
 * Describes a user's contributions (commits, issues or pull request reviews) on a monthly basis
 */
export interface MonthlyContributions {
    /**
     * Which month of the year the contributions were made in
     */
    month: string;
    /**
     * Number of contributions made in private repositories
     */
    privateContributionsCount: number;
    /**
     * Contributions made in public repositories
     */
    publicContributions: ContributionsByRepository[];
}

/**
 * Describes a user's contributions (commits, issues or pull request reviews) in a specific repository
 */
export interface ContributionsByRepository {
    /**
     * Repository contributed to
     */
    repository: RepositoryProfileMinified;
    /**
     * Number of contributions in repository
     */
    count: number;
}

/**
 * Describes a user's pull request contributions on a monthly basis
 */
export interface MonthlyPullRequestContributions {
    /**
     * Which month of the year the contributions were made in
     */
    month: string;
    /**
     * Number of pull requests opened in private repositories
     */
    privatePullRequestContributionsCount: number;
    /**
     * Pull request contributions to public repositories
     */
    publicPullRequestContributions: PullRequestContributionsByRepository[];
}

/**
 * Describes pull request contributions in repository
 */
export interface PullRequestContributionsByRepository {
    /**
     * Repository contributed to
     */
    repository: RepositoryProfileMinified;
    /**
     * Pull requests opened in repository
     */
    pullRequestContributions: PullRequest[];
}

/**
 * Describes pull request
 */
export interface PullRequest {
    /**
     * Title of pull request
     */
    title: string;
    /**
     * When pull request was first opened
     */
    creationDateTime: string;
    /**
     * Is pull request merged
     */
    isMerged: boolean;
    /**
     * Is pull request closed
     */
    isClosed: boolean;
    /**
     * Number of code additions in pull request
     */
    additionsCount: number;
    /**
     * Number of code deletions in pull request
     */
    deletionsCount: number;
    /**
     * The URL pointing to the pull request on GitHub – e.g. 'https://github.com/facebook/react/pull/16002'
     */
    publicUrl: string;
}

/**
 * Minified model used to reference GistProfile which contains more details
 */
export interface GistProfileMinified {
    /**
     * GitHub's own id for gist
     */
    gitHubId: string;
    /**
     * Name of gist
     */
    name: string;
    /**
     * GitHub username of owner of gist
     */
    ownerUsername: string;
    /**
     * The URL pointing to the gist on GitHub – e.g. 'https://gist.github.com/staltz/868e7e9bc2a7b8c1f754'
     */
    publicUrl: string;
}

/**
 * Public profile of gist
 */
export interface GistProfile extends GistProfileMinified {
    /**
     * Description of gist
     */
    description: string;
    /**
     * Indicates if the gist is forked
     */
    isFork: boolean;
    /**
     * When the gist was created on GitHub
     */
    creationDateTime: Date;
    /**
     * The last time a commit was pushed to the gist
     */
    lastPushDateTime: Date;
    /**
     * Number of direct forked gists
     */
    forksCount: number;
    /**
     * Number of users who have starred the repository
     */
    starsCount: number;
    /**
     * A list containing a breakdown of the programming language composition
     * of the gist's code
     */
    files: AppliedProgrammingLanguage[];
    /**
     * Number of comments made to gist
     */
    commentsCount: number;
}
