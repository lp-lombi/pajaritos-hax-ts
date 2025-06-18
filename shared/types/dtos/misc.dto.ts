import { GetUserDto } from "./user.dto";

export interface LoginResponseDto {
    token: string;
    user: GetUserDto;
}

export interface SeasonDto {
    id: number;
    name: string;
    isCurrent: boolean;
}

export interface StatsDto {
    score: number;
    assists: number;
    matches: number;
    wins: number;
    rating: number;
    season: SeasonDto;
}

export interface SubscriptionDto {
    tier: number;
    startDate: string;
    chatColor: string | null;
    scoreAnimId: number | null;
    scoreMessage: string | null;
    joinMessage: string | null;
    emoji: string | null;
}

export interface ApiRoomDto {
    name: string;
    link: string;
    players: number;
    maxPlayers: number;
    ttl: number; // Time to live in seconds
}
