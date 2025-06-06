export interface LoginDto {
    token: string;
    user: UserDto;
}

export interface StatsDto {
    score: number;
    assists: number;
    matches: number;
    wins: number;
    rating: number;
}

export interface UserDto {
    id: number;
    username: string;
    role: number;
    discordId: string | null;
    stats: StatsDto | null;
    subscription: SubscriptionDto | null;
}

export interface SeasonDto {
    id: number;
    name: string;
    isCurrent: boolean;
}

export interface BanDto {
    id: number;
    name: string;
    user: UserDto | null;
    byUser: Omit<Omit<UserDto, "stats">, "subscription"> | null;
    reason: string | null;
    startDate: string;
    days: number;
    ip: string;
    auth: string;
    isPermanent: boolean;
    isActive: boolean;
}

export interface SubscriptionDto {
    tier: number;
    startDate: string;
    scoreAnimId: number | null;
    scoreMessage: string | null;
    assistMessage: string | null;
    joinMessage: string | null;
    emoji: string | null;
}

export interface ApiRoomDTO {
    name: string;
    link: string;
    players: number;
    maxPlayers: number;
    ttl: number; // Time to live in seconds
}
