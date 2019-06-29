export interface UserProfile {
    gitHubId: string;
    username: string;
    displayName: string;
    company: string;
    publicUrl: string;
    creationDateTime: Date;
    avatarUrl: string;
    forHire: boolean;
    followersCount: number;
    organizationMemberships: OrganizationProfileMinified[];
    repositoryOwnerships: RepositoryProfileMinified[];
}

export interface OrganizationProfileMinified {
    gitHubId: string;
    name: string;
}

export interface OrganizationProfile extends OrganizationProfileMinified {
    displayName: string;
    description: string;
    avatarUrl: string;
    publicUrl: string;
    membersCount: number;
}

export interface ProgrammingLanguage {
    name: string;
    color: string;
}

export interface AppliedProgrammingLanguage extends ProgrammingLanguage {
    /**
     * The number of bytes of code written in the language
     */
    bytesCount: number;
}

export interface RepositoryProfileMinified {
    gitHubId: string;
    name: string;
    ownerUsername: string;
}

export interface RepositoryProfile extends RepositoryProfileMinified {
    description: string;
    primaryProgrammingLanguage: ProgrammingLanguage;
    appliedProgrammingLanguages: AppliedProgrammingLanguage[];
    isFork: boolean;
    publicUrl: string;
    creationDateTime: Date;
    lastPushDateTime: Date;
    topics: string[];
    starsCount: number;
    watchersCount: number;
    forkCount: number;
}
