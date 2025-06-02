import {
    DbBan,
    DbSeason,
    DbUser,
    DbUserStats,
    DbUserSubscription,
} from "../../shared/types/webApiDatabase";
import { BanDto, SeasonDto, UserDto } from "../../shared/types/webApiDTO";
import { getDatabase } from "../db/apiDatabase";

import { UsersService } from "./UsersService";
import { StatsService } from "./StatsService";
import { SeasonsService } from "./SeasonsService";
import { SubscriptionsService } from "./SubscriptionsService";

const usersService = new UsersService(getDatabase());
const seasonsService = new SeasonsService(getDatabase());
const statsService = new StatsService(getDatabase(), seasonsService);
const subscriptionsService = new SubscriptionsService(getDatabase());

export default class Utils {
    static calcRating(stats: DbUserStats) {
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

    static createUserDto(
        user: DbUser,
        userStats: DbUserStats | null,
        userSubscription?: DbUserSubscription | null
    ): UserDto {
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            discordId: user.discordId,
            stats: userStats
                ? {
                      score: userStats.score,
                      assists: userStats.assists,
                      matches: userStats.matches,
                      wins: userStats.wins,
                      rating: Utils.calcRating(userStats),
                  }
                : null,
            subscription: userSubscription
                ? {
                      tier: userSubscription.tier,
                      startDate: userSubscription.startDate,
                      scoreAnimId: userSubscription.scoreAnimId,
                      scoreMessage: userSubscription.scoreMessage,
                      assistMessage: userSubscription.assistMessage,
                      joinMessage: userSubscription.joinMessage,
                      emoji: userSubscription.emoji,
                  }
                : null,
        };
    }

    static createSeasonDto(season: DbSeason): SeasonDto {
        return {
            id: season.id,
            name: season.name,
            isCurrent: season.isCurrent === 1,
        };
    }

    static createBanDto(
        ban: DbBan,
        user: UserDto | null = null,
        byUser: UserDto | null = null
    ): BanDto {
        return {
            id: ban.id,
            name: ban.toUserName,
            user,
            byUser,
            reason: ban.reason,
            startDate: ban.startDate,
            days: ban.days,
            ip: ban.ip,
            auth: ban.auth,
            isPermanent: ban.isPermanent === 1,
            isActive: ban.isActive === 1,
        };
    }

    static async getUserDtoByUserId(userId: number): Promise<UserDto | null> {
        try {
            const user = await usersService.getUserById(userId);
            if (!user) return null;
            const userStats = await statsService.getStatsByUserId(userId);
            const userSubscription = await subscriptionsService.getSubscriptionByUserId(userId);
            return Utils.createUserDto(user, userStats, userSubscription);
        } catch (error) {
            console.error("Error al obtener el usuario:", error);
            return null;
        }
    }

    static async getAllUsersDto(filterWithStats = false): Promise<UserDto[]> {
        try {
            const users = await usersService.getAllUsers(filterWithStats);
            const usersDto: UserDto[] = [];
            for (const user of users) {
                const userStats = await statsService.getStatsByUserId(user.id);
                const userSubscription = await subscriptionsService.getSubscriptionByUserId(user.id);
                usersDto.push(Utils.createUserDto(user, userStats, userSubscription));
            }
            return usersDto;
        } catch (error) {
            console.error("Error al obtener todos los usuarios:", error);
            return [];
        }
    }
}
