import { Stats } from "../entities/Stats";
import { AppDataSource } from "../db/data-source";
import { Season } from "../entities/Season";
import { DeepPartial } from "typeorm";
import { StatsDto } from "@shared/types/dtos/misc.dto";
import { createStatsDto } from "../utils/dto-mappers";
import { User } from "../entities/User";

export class StatsService {
    private static instance: StatsService;
    private constructor(
        private statsRepository = AppDataSource.getRepository(Stats),
        private seasonsRepository = AppDataSource.getRepository(Season)
    ) {}
    static getInstance(): StatsService {
        if (!this.instance) {
            this.instance = new StatsService();
        }
        return this.instance;
    }

    /**
     * Si no se proporciona un seasonId, se obtiene la temporada actual.
     */
    async getStatsByUserId(
        userId: number,
        seasonId: number | null = null
    ): Promise<StatsDto | null> {
        const season = seasonId
            ? await this.seasonsRepository.findOne({ where: { id: seasonId } })
            : await this.seasonsRepository.findOneByOrFail({ isCurrent: true });
        if (!season) {
            console.error("No se encontró la temporada actual o la temporada especificada.");
            return null;
        }
        const stats = await this.statsRepository.findOne({
            where: {
                user: { id: userId },
                season: { id: season.id },
            },
            relations: ["season"],
        });
        if (!stats) {
            console.error(
                `No se encontraron stats para el usuario con ID ${userId} en la temporada ${season.id}.`
            );
            return null;
        }
        return createStatsDto(stats);
    }


    async sumStatsByUserId(userId: number, newData: Partial<Stats>): Promise<StatsDto | null> {
        const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
        if (!user) {
            console.error(`Usuario con ID ${userId} no encontrado.`);
            return null;
        }
        const currentSeason = await this.seasonsRepository.findOneOrFail({
            where: { isCurrent: true },
        });
        const stats =
            (await this.statsRepository.findOne({
                where: { user: { id: userId }, season: { isCurrent: true } },
                relations: ["season"],
            })) ||
            this.statsRepository.create({
                user,
                season: currentSeason,
                score: 0,
                assists: 0,
                matches: 0,
                wins: 0,
            });

        stats.score += newData.score || 0;
        stats.assists += newData.assists || 0;
        stats.matches += newData.matches || 0;
        stats.wins += newData.wins || 0;
        console.log(stats);

        await this.statsRepository.save(stats);
        return createStatsDto(stats);
    }
}
