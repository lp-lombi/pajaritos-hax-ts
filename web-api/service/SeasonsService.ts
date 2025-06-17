import { AppDataSource } from "../db/data-source";
import { Season } from "../entities/Season";
import { SeasonDto } from "@shared/types/dtos/misc.dto";

export class SeasonsService {
    private static instance: SeasonsService;
    private constructor(private seasonsRepository = AppDataSource.getRepository(Season)) {}

    static getInstance(): SeasonsService {
        if (!this.instance) {
            this.instance = new SeasonsService();
        }
        return this.instance;
    }

    async getAllSeasons(): Promise<SeasonDto[]> {
        const seasons = await this.seasonsRepository.find();
        return seasons.map((season) => ({
            id: season.id,
            name: season.name,
            isCurrent: season.isCurrent,
        }));
    }

    async getSeasonById(id: number): Promise<SeasonDto | null> {
        const season = await this.seasonsRepository.findOne({
            where: { id },
        });
        return season
            ? {
                  id: season.id,
                  name: season.name,
                  isCurrent: season.isCurrent,
              }
            : null;
    }

    async getCurrentSeason(): Promise<SeasonDto> {
        const currentSeason = await this.seasonsRepository.findOne({
            where: { isCurrent: true },
        });
        if (!currentSeason) {
            throw new Error("No hay una temporada actual definida");
        }
        return {
            id: currentSeason.id,
            name: currentSeason.name,
            isCurrent: currentSeason.isCurrent,
        };
    }

    /**
     * Al crear una nueva temporada, automáticamente se establece como la temporada actual.
     */
    async createSeason(name: string): Promise<SeasonDto> {
        const newSeason = this.seasonsRepository.create({ name, isCurrent: true });
        await this.seasonsRepository.save(newSeason);

        // Desactivar la temporada actual anterior
        const currentSeason = await this.getCurrentSeason();
        if (currentSeason && currentSeason.id !== newSeason.id) {
            currentSeason.isCurrent = false;
            await this.seasonsRepository.save(currentSeason);
        }

        return {
            id: newSeason.id,
            name: newSeason.name,
            isCurrent: newSeason.isCurrent,
        };
    }
}
