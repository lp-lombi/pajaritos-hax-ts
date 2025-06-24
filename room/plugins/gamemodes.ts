import { MainReturnType } from "shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib } from "../types";

export enum Gamemodes {
    X4 = 1,
    X5 = 2,
    Freeroam = 3,
    EnanosVsGordos = 4,
}

export default function (API: MainReturnType) {
    class GamemodesPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;
        gamemode: Gamemodes = Gamemodes.X4;

        constructor() {
            super("lmbGamemodes", true, {
                version: "0.1",
                author: "lombi",
                description: `Plugin para gestionar los modos de juego.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        override initialize = () => {
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.phLib || !this.commands) {
                throw new Error("gamemodes: se requiere el plugin de comandos.");
            } else {
                this.commands.registerCommand(
                    "!",
                    "gm",
                    (msg, args) => {
                        if (args.length === 0) {
                            var str =
                                "[1] Normal - Futsal x4\n[2] Normal - Futsal x5\n[3] Freeroam - Juegan Todos";
                            str += "\n !gm <id>.";
                            this.commands.chat.announce(str, msg.byId);
                        } else {
                            const gamemode = parseInt(args[0]);
                            if (!isNaN(gamemode)) {
                                if (gamemode === Gamemodes.X4) {
                                    this.commands.chat.announce(
                                        "Cambiando el modo de juego a Futsal x4",
                                        msg.byId
                                    );
                                    this.gamemode = Gamemodes.X4;
                                    this.room.fakeSendPlayerChat("!autobot equipos 4", msg.byId);
                                    this.room.fakeSendPlayerChat("!comba preset 2", msg.byId);
                                    this.room.fakeSendPlayerChat("!autobot afk 15 move", msg.byId);
                                    this.room.setScoreLimit(0);
                                } else if (gamemode === Gamemodes.X5) {
                                    this.commands.chat.announce(
                                        "Cambiando el modo de juego a Futsal x5",
                                        msg.byId
                                    );
                                    this.gamemode = Gamemodes.X5;
                                    this.room.fakeSendPlayerChat("!autobot equipos 5", msg.byId);
                                    this.room.fakeSendPlayerChat("!comba preset 3", msg.byId);
                                    this.room.fakeSendPlayerChat("!autobot afk 15 move", msg.byId);
                                    this.room.setScoreLimit(0);
                                } else if (gamemode === Gamemodes.Freeroam) {
                                    this.commands.chat.announce(
                                        "Cambiando el modo de juego a Juegan Todos",
                                        msg.byId
                                    );
                                    this.gamemode = Gamemodes.Freeroam;
                                    this.room.fakeSendPlayerChat("!autobot equipos 15", msg.byId);
                                    this.room.fakeSendPlayerChat("!comba preset 4", msg.byId);
                                    this.room.fakeSendPlayerChat("!autobot afk 25 kick", msg.byId);
                                    this.room.setScoreLimit(0);
                                }
                            } else {
                                this.commands.chat.announce(
                                    "El argumento debe ser un número.",
                                    msg.byId
                                );
                            }
                        }
                    },
                    "Cambia el modo de juego. !gamemode id",
                    false,
                    2
                );
            }
        };
    }

    return new GamemodesPlugin();
}
