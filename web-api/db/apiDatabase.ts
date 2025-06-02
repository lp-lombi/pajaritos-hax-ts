import path from "path";
import fs from "fs";
import { Database } from "sqlite3";

let dbInstance: Database | null = null;

async function createFromSchema(dbPath: string): Promise<Database> {
  return new Promise<Database>((resolve, reject) => {
    const db = new Database(dbPath);
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    db.exec(schema, (error) => {
      if (error) return reject(error);
      resolve(db);
    });
  });
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
      const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
      dbInstance = new Database(dbPath);
      dbInstance.exec(schema, (error) => {
        if (error) {
          console.error(`Error al crear la base de datos: ${error}`);
          throw error;
        }
        console.log("Base de datos creada.");
      });
    }
    return dbInstance;
  } catch (error) {
    console.error(`Error al obtener la base de datos: ${error}`);
    throw error;
  }
}
