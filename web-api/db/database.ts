import path from "path";
import fs from "fs";
import { Database } from "sqlite3";
import { UsersService } from "../service/UsersService";
import { SeasonsService } from "../service/SeasonsService";

let dbInstance: Database | null = null;

function createFromSchema(dbPath: string): Database {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    const newDb = new Database(dbPath);
    newDb.exec(schema, (error) => {
        if (error) {
            console.error(`Error al crear la base de datos: ${error}`);
            throw error;
        }
        console.log("Base de datos creada.");
    });

    const usersService = new UsersService(newDb);
    const seasonsService = new SeasonsService(newDb);
    // Insert default root user
    usersService.createUser("root", process.env.ROOT_PASSWORD as string, 3, null);
    seasonsService.createSeason("Pajaritos Hax");
    return newDb;
}

export function getDatabase(): Database {
    if (dbInstance) {
        return dbInstance;
    }
    try {
        const dbPath = path.join(__dirname, "webapi.db");
        if (fs.existsSync(dbPath)) {
            dbInstance = new Database(dbPath);
        } else {
            dbInstance = createFromSchema(dbPath);
        }
        return dbInstance;
    } catch (error) {
        console.error(`Error al obtener la base de datos: ${error}`);
        throw error;
    }
}
