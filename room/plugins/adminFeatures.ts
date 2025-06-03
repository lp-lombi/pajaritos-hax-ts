import { MainReturnType, Player } from "@shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib, PHPlayer } from "../types";

export default function AdminFeatures (API: MainReturnType) {
    class AdminFeaturesPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;

        constructor() {
            super("lmbAdminFeatures", true, {
                version: "0.1",
                author: "lombi",
                description: `Comandos para administradores.`,
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
                throw new Error("adminFeatures: se requiere el plugin de comandos.");
            } else {
                this.commands.registerCommand(
                    "!",
                    "warn",
                    (msg, args) => {
                        if (args.length < 2) {
                            this.commands.chat.announce(
                                "Uso: !warn @user esta es tu primera advertencia",
                                msg.byId
                            );
                        } else {
                            if (args[0].startsWith("@")) {
                                const name = args[0].substring(1).replace(/_/g, " ");
                                const warnedPlayer = this.phLib.players.find(
                                    (p) => p.name === name
                                );
                                const adminPlayer = this.phLib.getPlayer(msg.byId);
                                if (warnedPlayer && adminPlayer) {
                                    const warnText = `⚠️ [ADVERTENCIA DE ${adminPlayer.name} A ${
                                        warnedPlayer.name
                                    }] ${args.slice(1).join(" ")} ⚠️`;
                                    this.commands.chat.announce(
                                        warnText,
                                        warnedPlayer.id,
                                        "warn",
                                        2
                                    );
                                    this.commands.chat.announce(warnText, msg.byId, "warn", 0);
                                    this.commands.chat.announce(
                                        `El jugador ${warnedPlayer.name} fue advertido por un administrador.`,
                                        null,
                                        "info-big"
                                    );
                                }
                            }
                        }
                    },
                    "Envía una advertencia a un jugador con un mensaje. '!warn @user esta es tu primera advertencia'",
                    false,
                    1
                );
                this.commands.registerCommand(
                    "!",
                    "an",
                    (msg, args) => {
                        if (args.length < 1) {
                            this.commands.chat.announce("Uso: !an Este es un anuncio", msg.byId);
                        } else {
                            let text = "[📢] " + args.join(" ");
                            this.commands.chat.announce(text, null, "announcement-big");
                        }
                    },
                    "Envía un anuncio a todos los jugadores con un mensaje. '!an Este es un anuncio'",
                    false,
                    1
                );
                this.commands.registerCommand(
                    "!",
                    "kick",
                    (msg, args) => {
                        if (args.length < 1) {
                            let str = this.commands.chat.getPlayersIdsString(this.phLib.players);
                            str +=
                                "\nREFERENCIA: un número ID más bajo indica que el usuario se unió antes. ";
                            str += "Tenerlo en cuenta cuando hay nombres duplicados";
                            str += "\n\nUso: ' !kick <id> mensaje de motivo '";
                            this.commands.chat.announce(str, msg.byId);
                        } else {
                            const id = parseInt(args[0]);
                            if (!isNaN(id)) {
                                const reason = args.slice(1).join(" ");
                                this.room.kickPlayer(id, reason, false);
                            } else {
                                this.commands.chat.announce(
                                    "Uso incorrecto. ' !kick <id> mensaje de motivo '",
                                    msg.byId,
                                    "error"
                                );
                            }
                        }
                    },
                    "Kickea a un jugador. ' !kick <id> mensaje de motivo '",
                    false,
                    1
                );
                this.commands.registerCommand(
                    "!",
                    "msgspam",
                    (msg, args) => {
                        if (args.length < 1) {
                            this.commands.chat.announce("Uso: !an Este es un anuncio", msg.byId);
                        } else {
                            let text = args.join(" ");
                            let i = setInterval(() => {
                                this.room.sendAnnouncement(
                                    text,
                                    null,
                                    parseInt("FF9999", 16),
                                    null as unknown as number,
                                    2
                                );
                            }, 5);
                            setTimeout(() => {
                                clearInterval(i);
                            }, 500);
                        }
                    },
                    "USAR CON PRECAUCIÓN Y EN INTERVALOS DE TIEMPO ESPACIADOS. ' !spam mensaje '",
                    true,
                    2
                );
            }
        };
    }

    return new AdminFeaturesPlugin();
}
