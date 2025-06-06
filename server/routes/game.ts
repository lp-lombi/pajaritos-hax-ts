import { Router } from "express";
import fs from "fs";
import { getCommandsPlugin } from "../utils";
const game = Router();

game.get("/start", global.verifyToken, function (req, res) {
    if (!global.room) {
        res.send("Host not open");
    } else {
        try {
            global.room.startGame();
            res.send("Game started");
        } catch (e) {
            console.log(e);
        }
    }
});

game.get("/pause", global.verifyToken, function (req, res) {
    if (!global.room) {
        res.send("Host not open");
    } else {
        try {
            global.room.pauseGame();
            res.send("Game paused");
        } catch (e) {
            console.log(e);
        }
    }
});

game.get("/stop", global.verifyToken, function (req, res) {
    if (!global.room) {
        res.send("Host not open");
    } else {
        try {
            global.room.stopGame();
            res.send("Game stopped");
        } catch (e) {
            console.log(e);
        }
    }
});

game.get("/data", global.verifyToken, function (req, res) {
    if (!global.room) {
        res.send("Host not open");
    } else {
        try {
            let data = {
                redScore: global.room.redScore,
                blueScore: global.room.blueScore,
                state: global.room.isGamePaused()
                    ? "paused"
                    : global.room.gameState
                    ? "playing"
                    : "stopped",
            };
            res.send(JSON.stringify(data));
        } catch (e) {
            console.log(e);
        }
    }
});

game.post("/stadium/load", global.verifyToken, function (req, res) {
    if (!global.room) {
        res.send("Host not open");
    } else {
        try {
            fs.readFile(global.stadiumsPath + req.body.stadium, "utf8", function (err, data) {
                if (!err) {
                    const c = getCommandsPlugin();
                    if (c) {
                        const stadium = c.Utils.parseStadium(data);
                        if (stadium) {
                            global.room?.stopGame();
                            global.room?.setCurrentStadium(stadium);
                        }
                    }
                    res.send("Stadium loaded");
                } else {
                    res.status(400).send("No se pudo cargar el estadio: " + err);
                }
            });
        } catch (e) {
            console.log(e);
            res.status(400).send("Error al cargar el estadio: " + e);
        }
    }
});

game.post("/stadium/save", global.verifyToken, function (req, res) {
    if (!global.room) {
        res.send("Host not open");
    } else {
        try {
            const c = getCommandsPlugin();
            if (c) {
                let stadiumData = c.Utils.exportStadium(global.room.stadium);
                if (stadiumData) {
                    fs.writeFile(
                        global.stadiumsPath + req.body.stadiumName + ".hbs",
                        stadiumData,
                        (err) => {
                            if (err) {
                                res.status(400).send("No se pudo guardar el estadio: " + err);
                            } else {
                                res.send("Estadio guardado");
                            }
                        }
                    );
                    return;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
});

export default game;
