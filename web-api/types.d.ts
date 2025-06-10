export interface DbUser {
    id: number;
    username: string;
    password: string;
    discordId: string | null;
    role: number;
    createDate: string;
    lastLoginDate: string | null;
}

export interface DbSeason {
    id: number;
    name: string;
    isCurrent: number;
}

export interface DbUserStats {
    id: number;
    userId: number;
    seasonId: number;
    score: number;
    assists: number;
    matches: number;
    wins: number;
}

export interface DbUserSubscription {
    id: number;
    userId: number;
    tier: number;
    startDate: string;
    scoreAnimId: number | null;
    scoreMessage: string | null;
    assistMessage: string | null;
    joinMessage: string | null;
    emoji: string | null;
}

export interface DbBan {
    id: number;
    toUserId: number | null;
    toUserName: string;
    byUserId: number;
    reason: string | null;
    startDate: string;
    days: number;
    ip: string;
    auth: string;
    isPermanent: number;
    isActive: number;
}
