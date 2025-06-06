import dotenv from "dotenv";
import fs from "fs";
import { ApiKey } from "./ApiKey";

interface EnvVars {
    API_KEY: string;
    JWT_SECRET: string;
    JWT_EXPIRATION_HOURS: string;
    ROOT_PASSWORD: string;
}

export class EnvFile {
    private static defaultEnvVars: EnvVars = {
        API_KEY: ApiKey.generateOne(),
        JWT_SECRET: "clave_secreta",
        JWT_EXPIRATION_HOURS: "1",
        ROOT_PASSWORD: "root",
    };
    private constructor() {}
    static parse(path: string) {
        if (!fs.existsSync(path)) {
            console.error(
                `El archivo .env no existe en la ruta: ${path}. Se creará uno nuevo, completarlo con los datos requeridos antes de iniciar.`
            );
            this.create(path);
            process.exit(1);
        }
        dotenv.config();
        for (const varName of Object.keys(this.defaultEnvVars)) {
            if (!process.env[varName]) {
                console.error(
                    `La variable de entorno ${varName} no está definida. Por favor, completa el archivo .env.`
                );
                process.exit(1);
            }
        }
        ApiKey.set(process.env.API_KEY as string);
    }
    static create(path: string) {
        let str = `# Archivo .env creado automáticamente. Completar con los datos requeridos.\n\n`;
        for (const varName of Object.keys(this.defaultEnvVars)) {
            let comment = "\n";
            if (varName === "API_KEY") {
                comment += "# Esta variable se genera automáticamente. No modificar manualmente.\n";
            }
            if (varName === "ROOT_PASSWORD") {
                comment += "# Contraseña del usuario root por defecto.\n";
            }
            str += `${comment}${varName}=${this.defaultEnvVars[varName as keyof EnvVars]}\n`;
        }
        fs.writeFileSync(path, str);
    }
}
