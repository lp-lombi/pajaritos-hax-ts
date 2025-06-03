import { Database } from "sqlite3";
import { DbBan, DbUserSubscription } from "../types";

export class SubscriptionsService {
    constructor(private database: Database) {}

    async getAllSubscriptions(): Promise<DbUserSubscription[]> {
        return new Promise((resolve, reject) => {
            this.database.all<DbUserSubscription>("SELECT * FROM subscriptions", (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    async getSubscriptionById(id: number): Promise<DbUserSubscription | null> {
        return new Promise((resolve, reject) => {
            this.database.get<DbUserSubscription>(
                "SELECT * FROM subscriptions WHERE id = ?",
                [id],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row || null);
                }
            );
        });
    }

    async getSubscriptionByUserId(userId: number): Promise<DbUserSubscription | null> {
        return new Promise((resolve, reject) => {
            this.database.get<DbUserSubscription>(
                "SELECT * FROM subscriptions WHERE userId = ?",
                [userId],
                (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row || null);
                }
            );
        });
    }

    async createSubscription(
        userId: number,
        tier: number,
        startDate: string
    ): Promise<DbUserSubscription> {
        return new Promise((resolve, reject) => {
            this.database.run(
                "INSERT INTO subscriptions (userId, tier, startDate) VALUES (?, ?, ?)",
                [userId, tier, startDate],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve({
                        id: this.lastID,
                        userId,
                        tier,
                        startDate,
                        scoreAnimId: null,
                        scoreMessage: null,
                        assistMessage: null,
                        joinMessage: null,
                        emoji: null,
                    });
                }
            );
        });
    }

    async updateSubscription(
        userId: number, newData: Partial<DbUserSubscription>
    ): Promise<DbUserSubscription | null> {
        const sql = `UPDATE subscriptions SET ${Object.keys(newData).map(key => `${key} = ?`).join(", ")} WHERE userId = ?`;
        const params = [...Object.values(newData), userId];
        const that = this;
        return new Promise((resolve, reject) => {
            this.database.run(sql, params, async function (err) {
                if (err) {
                    return reject(err);
                }
                const updatedSubscription = await that.getSubscriptionByUserId(userId);
                resolve(updatedSubscription);
            });
        });
    }

    async deleteSubscription(id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.run("DELETE FROM subscriptions WHERE id = ?", [id], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes > 0);
            });
        });
    }

    async deleteSubscriptionByUserId(userId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.run("DELETE FROM subscriptions WHERE userId = ?", [userId], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes > 0);
            });
        });
    }
}