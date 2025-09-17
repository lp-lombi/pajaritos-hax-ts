import { SeasonDto, StatsDto, SubscriptionDto } from "../../shared/types/dtos/misc.dto";
import { GetBanDto } from "@shared/types/dtos/ban.dto";
import { GetUserDto } from "@shared/types/dtos/user.dto";

import { User } from "../entities/User";
import { Stats } from "../entities/Stats";
import { Season } from "../entities/Season";
import { Ban } from "../entities/Ban";
import { Subscription } from "../entities/Subscription/Subscription";

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
    userStats: Stats | null = null,
    userSubscription: Subscription | null = null
): GetUserDto {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        discordId: user.discordId,
        createDate: user.createDate.toISOString(),
        lastLoginDate: user.lastLoginDate?.toISOString() || null,
        stats: userStats ? createStatsDto(userStats) : null,
        wallet: user.wallet ? {
            balance: user.wallet.balance,
            totalEarned: user.wallet.totalEarned,
            totalSpent: user.wallet.totalSpent,
        } : { balance: 0, totalEarned: 0, totalSpent: 0 },
        subscription: userSubscription ? createSubscriptionDto(userSubscription) : null,
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
    const scoreAnimId = subscription.properties.find(
        (p) => p.type.name === "scoreAnimId"
    )?.value;
    const scoreMessage = subscription.properties.find(
        (p) => p.type.name === "scoreMessage"
    )?.value;
    const chatColor = subscription.properties.find(
        (p) => p.type.name === "chatColor"
    )?.value;
    const joinMessage = subscription.properties.find(
        (p) => p.type.name === "joinMessage"
    )?.value;
    const emoji = subscription.properties.find((p) => p.type.name === "emoji")?.value;
    return {
        tier: subscription.tier,
        startDate: subscription.startDate.toISOString(),
        scoreAnimId: scoreAnimId ? parseInt(scoreAnimId, 10) : null,
        scoreMessage: scoreMessage || null,
        chatColor: chatColor || null,
        joinMessage: joinMessage || null,
        emoji: emoji || null,
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
    toUser: User | null = null,
    byUser: User | null = null
): GetBanDto {
    return {
        id: ban.id,
        name: ban.toUserName,
        user: toUser ? createUserDto(toUser, null) : null,
        byUser: byUser ? createUserDto(byUser, null) : null,
        reason: ban.reason,
        startDate: ban.startDate.toISOString(),
        days: ban.days,
        ip: ban.ip,
        auth: ban.auth,
        isPermanent: ban.isPermanent,
        isActive: ban.isActive,
    };
}
