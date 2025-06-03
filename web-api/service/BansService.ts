import { Database } from "sqlite3";
import { DbBan } from "../types";


export class BansService {
    constructor(private database: Database) {}

    async getAllBans(): Promise<DbBan[]> {
        return new Promise((resolve, reject) => {
            this.database.all<DbBan>("SELECT * FROM bans", (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    async getBansByBannedUserId(userId: number): Promise<DbBan[]> {
        return new Promise((resolve, reject) => {
            this.database.all<DbBan>(
                "SELECT * FROM bans WHERE toUserId = ?",
                [userId],
                (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }

    async getBansByAdminUserId(userId: number): Promise<DbBan[]> {
        return new Promise((resolve, reject) => {
            this.database.all<DbBan>(
                "SELECT * FROM bans WHERE byUserId = ?",
                [userId],
                (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }

    async createBan(
        toUserId: number | null,
        toUserName: string,
        byUserId: number,
        reason: string | null,
        startDate: string,
        days: number,
        ip: string,
        auth: string,
        isPermanent: number
    ): Promise<DbBan> {
        return new Promise((resolve, reject) => {
            this.database.run(
                "INSERT INTO bans (toUserId, toUserName, byUserId, reason, startDate, days, ip, auth, isPermanent, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [toUserId, toUserName, byUserId, reason, startDate, days, ip, auth, isPermanent, 1],
                function (err) {
                    if (err) {
                        console.error(`Error al crear el ban: ${err}`);
                        return reject(err);
                    }
                    resolve({
                        id: this.lastID,
                        toUserId,
                        toUserName,
                        byUserId,
                        reason,
                        startDate,
                        days,
                        ip,
                        auth,
                        isPermanent,
                        isActive: 1,
                    });
                }
            );
        });
    }

    async updateBan(id: number, newData: Omit<Partial<DbBan>, "id">): Promise<DbBan | null> {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE bans SET " + Object.keys(newData).map((key) => `${key} = ?`).join(", ") + " WHERE id = ?";
            const params = [...Object.values(newData), id];
            this.database.run(sql, params, function (err) {
                if (err) {
                    console.error(`Error al actualizar el ban con ID ${id}: ${err}`);
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null);
                }
                resolve({ ...newData, id } as DbBan);
            });
        });
    }
}