import { EnvFile } from "./utils/EnvFile";
import path from "path";
EnvFile.parse(path.join(__dirname, ".env"));
import express from "express";
import cors from "cors";
import { usersRouter } from "./routes/usersRouter";
import { seasonsRouter } from "./routes/seasonsRouter";
import { bansRouter } from "./routes/bansRouter";
import { requireApiKey } from "./middleware/auth";
import { authRouter } from "./routes/authRouter";
import { roomsRouter } from "./routes/roomsRoutes";

// var discordBot = require(path.join(__dirname, "./discord/main.js"));
async function init() {
    const app = express();

    app.use(express.json());
    app.use(cors());

    app.use("/api/v2/auth", authRouter);
    app.use("/api/v2/users", requireApiKey, usersRouter);
    app.use("/api/v2/seasons", requireApiKey, seasonsRouter);
    app.use("/api/v2/bans", requireApiKey, bansRouter);
    app.use("/api/v2/rooms", requireApiKey, roomsRouter);

    const port = 3000;
    app.listen(port);
    console.log(`Servicio web corriendo en http://localhost:${port}/`);
}

init();
