import { Router } from "express";
import { readdirSync } from "fs";
import { CommandsPlugin, CreateRoomParamsOptionalGeo } from "room/types";
import HaxballRoom from "room";
import { PajaritosRoomConfig } from "room/types";
import { Config, getCommandsPlugin } from "../utils";
import path, { parse } from "path";
import { PajaritosRoomConfigFile } from "../types";
import { Plugin } from "@shared/types/node-haxball";

const roomRouter = Router();

interface StartRoomRequestBody {
    roomName: string;
    roomPassword: string;
    maxPlayers: number;
    botName: string;
    token: string;
}

const sendStatusInterval = setInterval(() => {
    if (global.room && global.room.players && global.room.password !== "") {
        fetch(`${global.webApi.url}/rooms/add`, {
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



roomRouter.post("/start", async (req, res) => {
    if (!global.room) {
        const config = req.body as StartRoomRequestBody;
        if (!config.roomName || !config.roomPassword || !config.maxPlayers || !config.botName) {
            res.status(400).send(
                "Se requieren argumentos: roomName, roomPassword, maxPlayers, botName"
            );
            return;
        }

        const createParams: CreateRoomParamsOptionalGeo = {
            name: config.roomName,
            password: config.roomPassword,
            maxPlayerCount: config.maxPlayers,
            token: config.token,
            noPlayer: false,
            showInRoomList: true,
        };

        try {
            global.room = await HaxballRoom({
                createParams,
                botName: config.botName,
                webApi: global.webApi,
            });
            // se guarda la configuracion
            const newFile: PajaritosRoomConfigFile = {
                createParams,
                botName: config.botName,
                webApi: {
                    url: global.webApi.url,
                    user: {
                        username: global.webApi.user.username,
                        password: global.webApi.user.password,
                    },
                },
                jwtSecret: global.jwtSecret,
            };
            Config.createNewConfigFile(path.join(`${__dirname}/../roomConfig.json`), newFile);

            console.log(`\n- ** Sala iniciada **\n- ${global.room.name} - ${global.room.link}`);
            res.send(`Sala iniciada: ${global.room.name} - ${global.room.link}`)
        } catch (e) {
            console.log("Error al iniciar la sala:", e);
            res.status(500).send("Error al iniciar la sala");
            return;
        }
    } else {
        res.send("Host actualmente abierto");
    }
});

roomRouter.post("/stop", (req, res) => {
    try {
        global.room?.leave();
        global.room = null;
        console.log("Sala cerrada.");
        res.end("Sala cerrada.");
    } catch (e) {
        console.log(e);
    }
});

roomRouter.get("/", (req, res) => {
    if (global.room) {
        let roomData = {
            name: global.room.name,
            link: global.room.link,
            stadiumName: global.room.stadium.name,
            plugins: Array<Plugin>(),
            stadiums: Array<string>(),
            bannedPlayers: global.room.banList.map((b) => {
                let banData: any = {};
                if (b.type === 0) {
                    banData.value = {
                        pId: (b.value as any).pId,
                        pName: (b.value as any).pName,
                        auth: (b.value as any).auth,
                        ips: (b.value as any).ips,
                    };
                } else if (b.type === 1) {
                    banData.value = {
                        ip: (b.value as any).ip,
                        mask: (b.value as any).mask,
                    };
                } else if (b.type === 2) {
                    banData.value = banData.value;
                }
                return banData;
            }),
        };

        /* global.room.plugins.forEach((pl) => {
            let settings = pl.publicSettings ? pl.publicSettings : null;
            if (settings) {
                settings.forEach((s) => {
                    s["value"] = s.getValue();
                });
            }

            roomData.plugins.push({
                name: pl.name,
                settings: settings,
            });
        }); */

        try {
            roomData.stadiums = readdirSync(global.stadiumsPath).filter((s) =>
                s.toUpperCase().endsWith(".HBS")
            );
        } catch (e) {
            console.log(e);
        }

        res.send(JSON.stringify(roomData));
    } else {
        res.status(400).send("Sala no abierta");
    }
});

roomRouter.get("/status", (req, res) => {
    let data = {
        status: "closed",
    };

    if (global.room) {
        if (global.room.link.startsWith("https://www.haxball.com/")) {
            data.status = "open";
        } else if (global.room.link.startsWith("Waiting")) {
            data.status = "token";
        }
    }

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
});

roomRouter.get("/config", async (req, res) => {
    try {
        const config = await Config.read();
        res.setHeader("Content-Type", "application/json");
        res.end(
            JSON.stringify({
                roomName: config.createParams.name,
                roomPassword: config.createParams.password,
                maxPlayers: config.createParams.maxPlayerCount,
                botName: config.botName,
                token: config.createParams.token,
            })
        );
    } catch (e) {
        console.log(e);
        res.status(500).send("Error reading config file");
        return;
    }
});

/**
 * @deprecated
 */
roomRouter.post("/setting", (req, res) => {
    if (global.room) {
        let pluginName = req.body.pluginName;
        let settingName = req.body.settingName;
        let value = req.body.value;

        if (!pluginName || !settingName || !value) {
            res.status(400).send("Missing arguments");
            return;
        } else {
            let plugin = global.room.plugins.find((p) => (p as any).name === pluginName);
            /*             if (plugin) {
                let setting = plugin.settings.find((s) => s.name === settingName);
                if (setting) {
                    setting.exec(value);
                }
            } */
        }
    } else {
        res.status(400).send("Sala no abierta");
    }
});

roomRouter.get("/chat", (req, res) => {
    if (global.room) {
        const commands = getCommandsPlugin();
        if (commands) {
            // let chat = commands.chatLog.join("\n");
            res.send(JSON.stringify({ chat: commands.chatLog }));
        }
    } else {
        res.status(400).send("Sala no abierta");
    }
});

roomRouter.post("/chat", (req, res) => {
    if (!global.room) {
        res.send("Sala no abierta");
    } else {
        try {
            let msg = req.body.msg;
            global.room.sendChat(msg, null);
            res.send("Message sent");
        } catch (e) {
            console.log(e);
        }
    }
});

roomRouter.post("/kick", (req, res) => {
    if (!global.room) {
        res.send("Sala no abierta");
    } else {
        try {
            const commands = getCommandsPlugin();
            if (!commands) {
                res.send("Commands plugin not found");
                return;
            }
            const playerId = parseInt(req.query.id as string);
            if (!playerId || isNaN(playerId)) {
                res.send("Invalid player id");
                return;
            }
            const player = commands.phLib.getPlayer(playerId);
            if (!player) {
                res.send("Jugador no encontrado");
                return;
            }
            const byUserId = parseInt(req.query.byUserId as string);
            const reason = req.query.reason
                ? (req.query.reason as string)
                : "";
            const isBanned = req.query.ban === "true";

            global.room.kickPlayer(playerId, reason, isBanned);

            if (isBanned) {
                const ban = global.room.banList.at(-1) as any;
                const ip = ban!.value.ips[0];
                const auth = ban!.value.auth;

                if (ban.value.pId === playerId) {
                    const commands = getCommandsPlugin();
                    commands?.registerBan(byUserId, player.user.id, player.name, ip, auth, false);
                    res.send("Jugador baneado");
                    return;
                }
            }

            res.send("Se kickeó al jugador");
        } catch (e) {
            console.log(e);
        }
    }
});

roomRouter.post("/kick/permaban", (req, res) => {
    if (!global.room) {
        res.send("Sala no abierta");
    } else {
        try {
            const { byUserId, name, ip, auth } = req.body;

            if (!name) {
                res.send("Nombre requerido");
                return;
            }

            const commands = getCommandsPlugin();
            if (commands) {
                commands.registerBan(byUserId, null, name, ip, auth, true);
                res.send("Jugador baneado");
                return;
            }

            res.send("Unable to find commands plugin");
        } catch (e) {
            console.log(e);
        }
    }
});

roomRouter.post("/kick/unban", (req, res) => {
    if (!global.room) {
        res.send("Sala no abierta");
    } else {
        const playerId = parseInt(req.query.id as string);

        if (!playerId) {
            res.send("Invalid player id");
        } else {
            try {
                global.room.clearBan(playerId);
                res.send("Unbanned");
            } catch (e) {
                console.log(e);
            }
        }
    }
});

export default roomRouter;
