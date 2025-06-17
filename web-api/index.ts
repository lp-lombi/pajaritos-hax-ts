import { EnvFile } from "./utils/EnvFile";
import path from "path";
EnvFile.parse(path.join(__dirname, ".env"));
import { AppDataSource, defaultDbValues } from "./db/data-source";

// var discordBot = require(path.join(__dirname, "./discord/main.js"));

async function init() {
    await AppDataSource.initialize();
    defaultDbValues();

    const express = require("express");
    const cors = require("cors");
    const { requireApiKey } = await import("./middleware/auth");
    const { usersRouter } = await import("./routes/usersRouter");
    const { seasonsRouter } = await import("./routes/seasonsRouter");
    const { bansRouter } = await import("./routes/bansRouter");
    const { authRouter } = await import("./routes/authRouter");
    const { roomsRouter } = await import("./routes/roomsRoutes");

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
