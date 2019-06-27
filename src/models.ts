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
