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
     * The user's own repositories
     */
    repositoryOwnerships: RepositoryProfileMinified[];
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
    color: string;
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
     * The primary used programming language of the repository's code
     */
    primaryProgrammingLanguage: ProgrammingLanguage;
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
     * Number of users who've starred the repository
     */
    starsCount: number;
    /**
     * Number of users watching the repository
     */
    watchersCount: number;
    /**
     * Number of direct forked repositories
     */
    forkCount: number;
}
