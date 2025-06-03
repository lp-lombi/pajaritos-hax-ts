import { ApiRoomDTO } from "@shared/types/webApiDTO";
import express from "express";


export const roomsRouter = express.Router();
export const roomsList: ApiRoomDTO[] = [];

const interval = setInterval(() => {
    roomsList.forEach((r) => {
        if (r.ttl-- <= 0) {
            roomsList.splice(roomsList.indexOf(r), 1);
        }
    });
}, 1000);

roomsRouter.get("/", (req, res) => {
    res.json({ rooms: roomsList });
});

roomsRouter.post("/", (req, res) => {
    if (req.body.name && req.body.link) {
        let room = roomsList.find((r) => r.link === req.body.link);
        if (room) {
            roomsList.splice(roomsList.indexOf(room), 1);
        }
        roomsList.push({
            name: req.body.name,
            link: req.body.link,
            players: req.body.players || 0,
            maxPlayers: req.body.maxPlayers || 0,
            ttl: 20,
        });
    }
    res.send({ success: true, message: "Room added" });
});
