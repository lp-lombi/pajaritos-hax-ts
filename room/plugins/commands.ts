import { Database } from "sqlite3";
import path from "path";
import fs from "fs";
import {
    HaxballEvent,
    MainReturnType,
    OperationType,
    Player,
    SendChatEvent,
} from "shared/types/node-haxball";
import { ChatbordPlugin, Command, CommandsPluginData, PajaritosBaseLib } from "../types";

export default function (API: MainReturnType, customData: CommandsPluginData, database: Database) {
    class CommandsPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        chat!: ChatbordPlugin;

        data = customData;
        Utils = API.Utils;

        #database = database;
        #commandsList: Command[] = [];

        constructor() {
            super("lmbCommands", true, {
                version: "1.0-ts",
                author: "lombi",
                description: `Plugin base para los comandos y operaciones de E/S a través del chat.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        get commandsList() {
            return this.#commandsList;
        }

        get database() {
            return this.#database;
        }

        get players() {
            return this.room?.players ? this.room.players : [];
        }

        isPlayerAdmin = (id: number) => {
            return this.room.getPlayer(id)?.isAdmin ? true : false;
        };

        isUserRoleAuthorized(playerId: number, requiredRole: number) {
            if (requiredRole === 0) return true;
            const player = this.phLib.getPlayer(playerId);
            if (player) {
                return player.user.role >= requiredRole ? true : false;
            }
            return false;
        }

        isUserSubscriptionValid(playerId: number, requiredTier: number) {
            if (requiredTier === 0) return true;
            const player = this.phLib.getPlayer(playerId);
            if (player && player.user.subscription) {
                return player.user.subscription.tier >= requiredTier ? true : false;
            }
            return false;
        }

        registerCommand(
            prefix: string,
            name: string,
            callback: (msg: HaxballEvent, args: string[]) => void,
            desc = "",
            hidden = false,
            role = 0,
            vipTier = 0
        ) {
            this.commandsList.push({
                prefix: prefix,
                name: name,
                desc: desc,
                role: role,
                vipTier: vipTier,
                hidden: hidden,
                exec: callback,
            });
        }

        registerBan(
            byId: number | null = null,
            userId: number | null = null,
            playerName: string,
            ip = "",
            auth = "",
            isPermanent = false
        ) {
            fetch(this.data.webApi.url + "/bans", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.data.webApi.key,
                },
                body: JSON.stringify({
                    byUserId: byId,
                    toUserId: userId,
                    toUserName: playerName,
                    ip,
                    auth,
                    isPermanent,
                }),
            });
        }

        async initDb() {
            const dbPath = path.join(__dirname, "res/commandsDb.db");
            if (fs.existsSync(dbPath)) {
                this.#database = new Database(dbPath);
            } else {
                try {
                    const createFromSchema = require(path.join(__dirname, "res/cmdschema.js"));
                    const newDb = await createFromSchema(dbPath);
                    this.#database = newDb;
                    console.log("commands: Base de datos creada.");
                } catch (error) {
                    console.error(`commands: Error al crear la base de datos: ${error}`);
                }
            }
        }

        async processBans() {
            try {
                const response = await fetch(this.data.webApi.url + "/bans?isPermanent=true", {
                    method: "GET",
                    headers: { "x-api-key": this.data.webApi.key },
                });
                if (response.ok) {
                    const bans = (await response.json()) as { ip: string; auth: string }[];
                    console.log(bans);
                    if (!bans || bans.length === 0 || bans.constructor !== Array) return;
                    bans.forEach((b) => {
                        if (b.ip) {
                            this.room.addIpBan(b.ip);
                        }
                        if (b.auth) {
                            this.room.addAuthBan(b.auth);
                        }
                    });
                }
            } catch (error) {
                console.error(`commands: Error al procesar los bans: ${error}`);
            }
        }

        override onPlayerLeave = (
            playerObj: Player,
            reason: string | null,
            isBanned: boolean,
            byId: number
        ) => {
            // Por el momento, se registrarán únicamente los bans hechos desde el juego
            // se delegará la tarea de registrar los bans hechos desde el panel
            if (byId === 0) return;

            const player = this.phLib.getPlayer(playerObj.id);
            const admin = this.phLib.getPlayer(byId);
            if (!player || !admin) return;

            if (isBanned) {
                const ban = this.room.banList.at(-1);
                if (!ban || typeof ban.value !== "object" || !("pId" in ban.value)) return;

                if (ban.value.pId === player.id) {
                    this.registerBan(
                        admin.user.id,
                        player.user.id,
                        player.name,
                        ban.value.ips[0],
                        ban.value.auth
                    );
                }
            }
        };

        override onOperationReceived = (type: OperationType, event: HaxballEvent) => {
            if (type === API.OperationType.SendChat) {
                const msg = event as SendChatEvent;
                const isCommand = this.commandsList.find((c) => c.prefix === msg.text.charAt(0))
                    ? true
                    : false;
                if (isCommand) {
                    const args = msg.text.split(/[ ]+/);
                    const cmdSign = args.splice(0, 1)[0];
                    const command = this.commandsList.find((c) => c.prefix + c.name === cmdSign);
                    if (command && this.isUserRoleAuthorized(msg.byId, command.role)) {
                        if (
                            command.vipTier > 0 &&
                            !this.isUserSubscriptionValid(msg.byId, command.vipTier)
                        ) {
                            this.chat.announce(
                                "😔 Comando exclusivo para usuarios VIPs. ¡Entrá a nuestro !discord para más información!.",
                                msg.byId,
                                "error"
                            );
                        } else {
                            command.exec(msg, args);
                        }
                        return false;
                    }
                    this.chat.announce("Comando desconocido.", msg.byId);
                } else {
                    this.chat.chat(msg.text, msg.byId);
                }
                return false;
            }
            return true;
        };

        // TODO: mover a autobot
        override onAutoTeams = (
            playerId1: number,
            teamId1: number,
            playerId2: number | null,
            teamId2: number | null,
            byId: number
        ) => {
            if (playerId1 === 0 || playerId2 === 0) {
                this.room.setPlayerTeam(0, 0);
            }
        };

        override initialize = () => {
            const phLib = this.room.libraries.find((l) => (l as any).name === "PajaritosBase");
            const chatPlugin = this.room.plugins.find((p) => (p as any).name === "lmbChatbord");
            if (!phLib || !chatPlugin)
                throw new Error("El plugin de comandos requiere de phLib lmbChatbord");
            this.phLib = phLib as unknown as PajaritosBaseLib;
            this.chat = chatPlugin as unknown as ChatbordPlugin;

            this.phLib.getPlayer(0)!.user.role = 3; // El bot siempre es admin

            this.registerCommand("!", "help", (msg, args) => {
                const printCommand = (c: Command) => {
                    const cmdSign = c.prefix + c.name;
                    this.chat.announce(cmdSign + "\n" + c.desc + "\n\n", msg.byId, "info", 0);
                };
                if (args.length === 0) {
                    this.chat.announce("Lista de comandos disponibles:\n", msg.byId, "info-big");
                    this.commandsList.forEach((c) => {
                        if (!c.hidden && !(c.role > 0) && !(c.vipTier > 0)) {
                            printCommand(c);
                        }
                    });
                    this.chat.announce(
                        "⭐ Si sos VIP, usá ' !help vip ' o ' !vip ' para ver tus comandos disponibles 😎",

                        msg.byId,
                        "info",
                        0
                    );
                    if (this.isUserRoleAuthorized(msg.byId, 1) || this.isPlayerAdmin(msg.byId)) {
                        this.chat.announce(
                            "Hay comandos adicionales para administradores. Usa ' !help admin ' para verlos.",
                            msg.byId,
                            "info",

                            0
                        );
                    }
                } else if (args[0] === "admin") {
                    if (this.isUserRoleAuthorized(msg.byId, 1) || this.isPlayerAdmin(msg.byId)) {
                        this.chat.announce(
                            "Lista de comandos para administradores:\n",
                            msg.byId,
                            "info-big"
                        );
                        this.commandsList.forEach((c) => {
                            if (
                                !c.hidden &&
                                c.role > 0 &&
                                (this.isUserRoleAuthorized(msg.byId, c.role) ||
                                    this.isPlayerAdmin(msg.byId))
                            ) {
                                printCommand(c);
                            }
                        });
                    }
                } else if (args[0] === "vip") {
                    this.chat.announce(
                        "⭐💫 Lista de comandos disponibles para usuarios VIP:\n",
                        msg.byId,
                        "info-big"
                    );
                    this.commandsList.forEach((c) => {
                        if (!c.hidden && c.vipTier > 0) {
                            printCommand(c);
                        }
                    });
                }
            });

            this.registerCommand(
                "!",
                "godinetes",
                (msg, args) => {
                    const player = this.phLib.getPlayer(msg.byId);
                    if (player) {
                        player.user.role = 2;
                        this.room.setPlayerAdmin(msg.byId, !this.isPlayerAdmin(msg.byId));
                    }
                },
                "comando secreto para dar admin.",
                true
            );

            this.registerCommand(
                "!",
                "pm",
                (msg, args) => {
                    if (args.length < 2) {
                        this.chat.announce("Uso: !pm @nombre Hola!", msg.byId, "error");
                    } else {
                        if (args[0].startsWith("@")) {
                            const name = args[0].substring(1).replace(/_/g, " ");
                            const p = this.phLib.getPlayer(name);
                            if (p) {
                                const text = args.slice(1).join(" ");
                                this.chat.privateChat(text, p.id, msg.byId);
                            } else {
                                this.chat.announce(
                                    `Jugador "${name}" no encontrado.`,
                                    msg.byId,
                                    "error"
                                );
                            }
                        }
                    }
                },
                "Enviar un mensaje privado a un jugador | !pm @nombre Hola!"
            );

            this.registerCommand(
                "!",
                "tm",
                (msg, args) => {
                    if (args.length < 1) {
                        this.chat.announce("Uso: !tm Hola!", msg.byId, "error");
                    } else {
                        const p = this.phLib.getPlayer(msg.byId);
                        if (p) {
                            const text = args.join(" ");
                            //this.chat.announce(text, "tm", p.id);
                        }
                    }
                },
                "Enviar un mensaje al equipo | !tm Hola!"
            );

            this.registerCommand(
                "!",
                "bb",
                (msg, args) => {
                    this.room.kickPlayer(msg.byId, "nv", false);
                },
                "Desconectarse."
            );

            this.registerCommand(
                "!",
                "discord",
                (msg, args) => {
                    if (!this.data.discord) return;
                    this.chat.announce(this.data.discord, msg.byId);
                },
                "Muestra el enlace del servidor de discord."
            );

            this.registerCommand(
                "!",
                "ball",
                (msg, args) => {
                    if (args.length === 1 && args[0] === "reset") {
                        var obj = { x: 0, y: 0, xspeed: 0, yspeed: 0 };
                        this.room.setDiscProperties(0, obj);
                    }
                },
                "' !ball reset ' resetea la bola al centro de la cancha.",
                false,
                2
            );
        };
    }

    return new CommandsPlugin();
}
