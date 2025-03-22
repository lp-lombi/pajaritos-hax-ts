import path from "path";
import fs from "fs";
import { Database } from "sqlite3";

async function createFromSchema(dbPath: string) {
    return new Promise<Database>((resolve, reject) => {
        const db = new Database(dbPath);
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS "announcements" ("id" INTEGER NOT NULL, "text" INTEGER, PRIMARY KEY("id" AUTOINCREMENT))`, (error) => {
                if (error) reject(error);
                db.run(
                    `CREATE TABLE IF NOT EXISTS "kits" ("id" INTEGER NOT NULL, "name" TEXT, "cfg" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`,
                    (error) => {
                        if (error) reject(error);
                        resolve(db);
                    }
                );
            });
        });
    });
}

export async function initDb() {
    return new Promise<Database>(async (resolve, reject) => {
        const dbPath = path.join(__dirname, "commandsDb.db");
        if (fs.existsSync(dbPath)) {
            resolve(new Database(dbPath));
        } else {
            try {
                const newDb = await createFromSchema(dbPath);
                resolve(newDb);
                console.log("commands: Base de datos creada.");
            } catch (error) {
                reject(error);
                console.error(`commands: Error al crear la base de datos: ${error}`);
            }
        }
    });
}
