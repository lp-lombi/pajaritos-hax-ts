import { SeasonDto, StatsDto, SubscriptionDto } from "../../shared/types/dtos/misc.dto";
import { GetBanDto } from "@shared/types/dtos/ban.dto";
import { GetUserDto } from "@shared/types/dtos/user.dto";

import { User } from "../entities/User";
import { Stats } from "../entities/Stats";
import { Subscription } from "../entities/Subscription";
import { Season } from "../entities/Season";
import { Ban } from "../entities/Ban";

export function calcRating(stats: Stats) {
    const baseScore = 1000;
    const scoreWeight = 4; // Peso de cada gol
    const assistWeight = 3; // Peso de cada asistencia
    const matchWeight = -3; // Peso de cada partido jugado (penalización para evitar inflar la puntuación solo por jugar muchos partidos)
    const winWeight = 6; // Peso de cada victoria
    const rating =
        baseScore +
        stats.score * scoreWeight +
        stats.assists * assistWeight +
        stats.matches * matchWeight +
        stats.wins * winWeight;
    return rating;
}

export function createUserDto(
    user: User,
    userStats: Stats | null,
    userSubscription?: Subscription | null
): GetUserDto {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        discordId: user.discordId,
        createDate: user.createDate.toISOString(),
        lastLoginDate: user.lastLoginDate?.toISOString() || null,
        stats: userStats
            ? {
                  score: userStats.score,
                  assists: userStats.assists,
                  matches: userStats.matches,
                  wins: userStats.wins,
                  season: createSeasonDto(userStats.season),
                  rating: calcRating(userStats),
              }
            : null,
        subscription: userSubscription
            ? {
                  tier: userSubscription.tier,
                  startDate: userSubscription.startDate.toISOString(),
                  scoreAnimId: userSubscription.scoreAnimId,
                  scoreMessage: userSubscription.scoreMessage,
                  assistMessage: userSubscription.assistMessage,
                  joinMessage: userSubscription.joinMessage,
                  emoji: userSubscription.emoji,
              }
            : null,
    };
}

export function createSeasonDto(season: Season): SeasonDto {
    return {
        id: season.id,
        name: season.name,
        isCurrent: season.isCurrent,
    };
}

export function createSubscriptionDto(subscription: Subscription): SubscriptionDto {
    return {
        tier: subscription.tier,
        startDate: subscription.startDate.toISOString(),
        scoreAnimId: subscription.scoreAnimId,
        scoreMessage: subscription.scoreMessage,
        assistMessage: subscription.assistMessage,
        joinMessage: subscription.joinMessage,
        emoji: subscription.emoji,
    };
}

export function createStatsDto(stats: Stats): StatsDto {
    return {
        score: stats.score,
        assists: stats.assists,
        matches: stats.matches,
        wins: stats.wins,
        rating: calcRating(stats),
        season: createSeasonDto(stats.season),
    };
}

export function createBanDto(
    ban: Ban,
    user: GetUserDto | null = null,
    byUser: GetUserDto | null = null
): GetBanDto {
    return {
        id: ban.id,
        name: ban.toUserName,
        user,
        byUser,
        reason: ban.reason,
        startDate: ban.startDate.toISOString(),
        days: ban.days,
        ip: ban.ip,
        auth: ban.auth,
        isPermanent: ban.isPermanent,
        isActive: ban.isActive,
    };
}