import cors from "cors";
import { Config } from "./utils";
import express, { Express, NextFunction, Request, Response } from "express";

global.stadiumsPath = "../room/stadiums/";
global.verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["token"];
    if (!token || typeof token !== "string") {
        res.status(403).send("Token requerido");
        return;
    }
    try {
        jwt.verify(token, global.jwtSecret, (err, decoded) => {
            if (err) return res.status(401).send("Token inválido");
            req.user = decoded as RoomServerUser;
            next();
        });
    } catch (error) {
        console.error("Error al verificar el token:", error);
        res.status(500).send("Error interno del servidor");
    }
};

import service from "./routes/service";
import login from "./routes/login";
import roomRouter from "./routes/room";
import players from "./routes/players";
import game from "./routes/game";
import jwt from "jsonwebtoken";
import { RoomServerUser } from "./types";

function listen(app: Express, port: number, attempts: number) {
    app.listen(port)
        .once("listening", () => {
            console.log(`- Panel de control: http://localhost:${port}/`);
        })
        .once("error", (err) => {
            if ((err as any).code === "EADDRINUSE") {
                if (attempts > 0) {
                    listen(app, port + 1, attempts - 1);
                    console.log(`El puerto ${port} está en uso, utilizando el siguiente`);
                } else {
                    console.error("Máximo de intentos alcanzados.");
                    process.exit(1);
                }
            }
        });
}

const sendStatusInterval = setInterval(() => {
    if (global.room && global.room.players && global.room.password !== "") {
        fetch(`${global.webApi.url}/rooms`, {
            method: "POST",
            headers: {
                "x-api-key": global.webApi.key,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: global.room.name,
                link: global.room.link,
                players: global.room.players.length,
                maxPlayers: global.room.maxPlayerCount,
            }),
        }).catch((err) => {
            console.log(err);
        });
    }
}, 15000);


async function init() {
    try {
        console.log("Iniciando servidor Pajaritos\n");
        // TODO: permitir configurar la primera vez el api url y key
        await Config.read();

        const app = express();
        app.use(express.json());
        app.use(cors());

        app.use(express.static("views/app"));
        app.use("/login", login);
        app.use("/service", global.verifyToken, service);
        app.use("/room", global.verifyToken, roomRouter);
        app.use("/game", global.verifyToken, game);
        app.use("/players", global.verifyToken, players);

        app.get("/app", (req, res) => {
            res.sendFile(__dirname + "/views/dist/index.html");
        });

        listen(app, 42925, 5);
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
}

init();
