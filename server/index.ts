import cors from "cors";
import { Config } from "./utils";
import service from "./routes/service";
import login from "./routes/login";
import roomRouter from "./routes/room";
import players from "./routes/players";
import game from "./routes/game";
import express, { Express } from "express";

global.stadiumsPath = "../room/stadiums/";

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

async function init() {
    try {
        console.log("Iniciando servidor Pajaritos\n");
        // TODO: permitir configurar la primera vez el api url y key
        const config = await Config.read();
        global.webApi.key = config.webApi.key;
        global.webApi.url = config.webApi.url;

        const app = express();
        app.use(express.json());
        app.use(cors());

        app.use(express.static("views/dist"));
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
