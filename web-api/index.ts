import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { usersRouter } from "./routes/usersRouter";
import { seasonsRouter } from "./routes/seasonsRouter";
import { bansRouter } from "./routes/bansRouter";
import { isAdmin } from "./middleware/auth";
import { authRouter } from "./routes/authRouter";
import { subscriptionsRouter } from "./routes/subscriptionsRouter";
import { roomsRouter } from "./routes/roomsRoutes";

function parseEnv() {
    const envFilePath = path.join(__dirname, ".env");
    if (!fs.existsSync(envFilePath)) {
        console.error(
            `El archivo .env no existe en la ruta: ${envFilePath}. Se creará uno nuevo, completarlo con los datos requeridos antes de iniciar.`
        );
        fs.writeFileSync(
            envFilePath,
            `# Archivo .env creado automáticamente. Completar con los datos requeridos.\n\nJWT_SECRET=clave_secreta\nJWT_EXPIRATION_HOURS=1`
        );
        process.exit(1);
    }
    dotenv.config();
    const requiredEnvVars = ["JWT_SECRET", "JWT_EXPIRATION_HOURS"];
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            console.error(
                `La variable de entorno ${varName} no está definida. Por favor, completa el archivo .env.`
            );
            process.exit(1);
        }
    }
}

// var discordBot = require(path.join(__dirname, "./discord/main.js"));
async function init() {
    parseEnv();

    const app = express();

    app.use(express.json());
    app.use(cors());

    app.use("/api/v2/auth", authRouter);
    app.use("/api/v2/users", isAdmin, usersRouter);
    app.use("/api/v2/subscriptions", isAdmin, subscriptionsRouter);
    app.use("/api/v2/seasons", isAdmin, seasonsRouter);
    app.use("/api/v2/bans", isAdmin, bansRouter);
    app.use("/api/v2/rooms", isAdmin, roomsRouter);

    const port = 3000;
    app.listen(port);
    console.log(`Servicio web corriendo en http://localhost:${port}/`);
}

init();
