import { Database } from "sqlite3";
import { DbSeason } from "../types";

export class SeasonsService {
    #database: Database;
    constructor(database: Database) {
        this.#database = database;
    }

    async getAllSeasons(): Promise<DbSeason[]> {
        return new Promise((resolve, reject) => {
            this.#database.all<DbSeason>("SELECT * FROM seasons", (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    async getSeasonById(id: number): Promise<DbSeason | null> {
        return new Promise((resolve, reject) => {
            this.#database.get<DbSeason>("SELECT * FROM seasons WHERE id = ?", [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    }

    async getCurrentSeason(): Promise<DbSeason | null> {
        return new Promise((resolve, reject) => {
            this.#database.get<DbSeason>(
                "SELECT * FROM seasons WHERE isCurrent = 1",
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row || null);
                }
            );
        });
    }

    /**
     * Al crear una nueva temporada, automáticamente se establece como la temporada actual.
     */
    async createSeason(name: string): Promise<DbSeason> {
        return new Promise((resolve, reject) => {
            const that = this;
            this.#database.run("BEGIN TRANSACTION")
            this.#database.run(
                "INSERT INTO seasons (name, isCurrent) VALUES (?, ?)",
                [name, 1],
                function (err) {
                    if (err) {
                        that.#database.run("ROLLBACK");
                        console.error(`Error al crear la temporada: ${err}`);
                        return reject(err);
                    }
                    const seasonId = this.lastID;
                    that.#database.run(
                        "UPDATE seasons SET isCurrent = 0 WHERE id != ?",
                        [this.lastID],
                        (err) => {
                            if (err) {
                                that.#database.run("ROLLBACK");
                                console.error(`Error al actualizar la temporada actual: ${err}`);
                                return reject(err);
                            }
                            that.#database.run("COMMIT");
                            resolve({ id: seasonId, name, isCurrent: 1 });
                        }
                    );
                }
            );
        });
    }
}
