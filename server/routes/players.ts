import { Router } from "express";
import { getPajaritosLib } from "../utils";
const players = Router();

interface PlayerData {
    id: number;
    name: string;
    team: number;
    admin: boolean;
}

players.get("/all", global.verifyToken, (req, res) => {
    if (global.room) {
        let playersData = {
            players: Array<PlayerData>(),
        };
        if (global.room.players) {
            global.room.players.forEach((p) => {
                playersData.players.push({
                    id: p.id,
                    name: p.name,
                    team: p.team.id,
                    admin: p.isAdmin,
                });
            });
        }

        res.send(JSON.stringify(playersData));
    } else {
        res.status(400).send("No hay sala abierta");
    }
});

players.get("/logged", global.verifyToken, (req, res) => {
    if (global.room) {
        const phLib = getPajaritosLib();
        if (phLib) {
            const playersData = phLib.players.map((p) => {
                return {
                    id: p.id,
                    name: p.name,
                    team: p.team.id,
                    admin: p.isAdmin,
                    isLoggedIn: p.isLoggedIn,
                };
            });

            res.send(JSON.stringify(playersData));
        } else {
            res.status(400).send("No se encontró la lib PajaritosBase");
        }
    } else {
        res.status(400).send("No hay sala abierta");
    }
});

export default players;
