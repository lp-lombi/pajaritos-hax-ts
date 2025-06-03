import { Database } from "sqlite3";
import { DbUser } from "../types";

export class UsersService {
    #database: Database;
    constructor(database: Database) {
        this.#database = database;
    }

    async getAllUsers(filterWithStats = false): Promise<DbUser[]> {
        return new Promise((resolve, reject) => {
            const sql =
                "SELECT * FROM users" +
                (filterWithStats
                    ? " WHERE EXISTS (SELECT 1 FROM stats WHERE users.id = stats.userId AND stats.matches > 0)"
                    : "");
            this.#database.all<DbUser>(sql, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    async getUserById(id: number): Promise<DbUser | null> {
        return new Promise((resolve, reject) => {
            this.#database.get<DbUser>("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
                if (err) {
                    console.error(`Error al obtener el usuario con ID ${id}: ${err}`);
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    }

    async getUserByUsername(username: string): Promise<DbUser | null> {
        return new Promise((resolve, reject) => {
            this.#database.get<DbUser>(
                "SELECT * FROM users WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) {
                        console.error(`Error al obtener el usuario con nombre ${username}: ${err}`);
                        return reject(err);
                    }
                    resolve(row || null);
                }
            );
        });
    }

    async createUser(
        username: string,
        password: string,
        role: number,
        discordId: string | null = null
    ): Promise<DbUser> {
        return new Promise((resolve, reject) => {
            this.#database.run(
                "INSERT INTO users (username, password, role, discordId) VALUES (?, ?, ?, ?)",
                [username, password, role],
                function (err) {
                    if (err) {
                        console.error(`Error al crear el usuario ${username}: ${err}`);
                        return reject(err);
                    }
                    resolve({ id: this.lastID, username, password, role, discordId });
                }
            );
        });
    }

    async updateUserById(id: number, newData: Partial<DbUser>): Promise<DbUser | null> {
        let sql = "UPDATE users SET ";
        sql += Object.keys(newData)
            .map((key) => `${key} = ?`)
            .join(", ");
        sql += " WHERE id = ?";
        const params = [...Object.values(newData), id];
        return new Promise((resolve, reject) => {
            const that = this;
            this.#database.run(sql, params, async function (err) {
                if (err) {
                    console.error(`Error al actualizar el usuario con ID ${id}: ${err}`);
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); // No se encontró el usuario
                }
                const updatedUser = await that.getUserById(id);
                resolve(updatedUser); // Devuelve el usuario actualizado
            });
        });
    }
}
