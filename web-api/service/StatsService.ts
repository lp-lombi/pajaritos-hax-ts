import { Database } from "sqlite3";
import { DbUserStats } from "../types";
import { SeasonsService } from "./SeasonsService";

export class StatsService {
    constructor(private database: Database, private seasonsService: SeasonsService) {}

    /**
     * Si no se proporciona un seasonId, se obtiene la temporada actual.
     */
    async getStatsByUserId(userId: number, seasonId: number | null = null): Promise<DbUserStats | null> {
        const currentSeasonId = seasonId || (await this.seasonsService.getCurrentSeason())?.id
        if (!currentSeasonId) {
            console.error("No se pudo obtener la temporada actual");
            return null;
        }
        return new Promise((resolve, reject) => {
            this.database.get<DbUserStats>(
                "SELECT * FROM stats WHERE userId = ? AND seasonId = ?",
                [userId, currentSeasonId],
                (err, row) => {
                    if (err) {
                        console.error(`Error al obtener los stats del usuario ID ${userId}: ${err}`);
                        return reject(err);
                    }
                    resolve(row || null);
                }
            );
        });
    }

    async createUserStats(userId: number, score: number = 0, assists: number = 0, matches: number = 0, wins: number = 0): Promise<DbUserStats> {
        const currentSeasonId = (await this.seasonsService.getCurrentSeason())?.id;
        if (!currentSeasonId) {
            throw new Error("No se pudo obtener la temporada actual");
        }
        return new Promise((resolve, reject) => {
            this.database.run(
                "INSERT INTO stats (userId, seasonId, score, assists, matches, wins) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, currentSeasonId, score, assists, matches, wins],
                function (err) {
                    if (err) {
                        console.error(`Error al crear los stats del usuario ${userId}: ${err}`);
                        return reject(err);
                    }
                    resolve({ id: this.lastID, userId, seasonId: currentSeasonId, score, assists, matches, wins});
                }
            );
        });
    }

    async updateStatsByUserId(userId: number, newData: Partial<DbUserStats>): Promise<DbUserStats | null> {
        let sql = "UPDATE stats SET ";
        sql += Object.keys(newData)
            .map((key) => `${key} = ?`)
            .join(", ");
        sql += " WHERE userId = ?";
        const params = [...Object.values(newData), userId];
        return new Promise(async (resolve, reject) => {
            const that = this;
            const existingStats = await this.getStatsByUserId(userId);
            if (!existingStats) await this.createUserStats(userId);
            this.database.run(sql, params, async function (err) {
                if (err) {
                    console.error(`Error al actualizar los stats con ID ${userId}: ${err}`);
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); 
                }
                const updatedStats = await that.getStatsByUserId(userId);
                resolve(updatedStats);
            });
        });
    }

    async sumStatsByUserId(userId: number, newData: Partial<DbUserStats>): Promise<DbUserStats | null> {
        let sql = "UPDATE stats SET ";
        sql += Object.keys(newData)
            .map((key) => `${key} = ${key} + ?`)
            .join(", ");
        sql += " WHERE userId = ?";
        const params = [...Object.values(newData), userId];
        return new Promise(async (resolve, reject) => {
            const that = this;
            const existingStats = await this.getStatsByUserId(userId);
            if (!existingStats) await this.createUserStats(userId);
            this.database.run(sql, params, async function (err) {
                if (err) {
                    console.error(`Error al actualizar los stats con ID ${userId}: ${err}`);
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); 
                }
                const updatedStats = await that.getStatsByUserId(userId);
                resolve(updatedStats);
            });
        });
    }
}
