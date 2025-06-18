import { Disc, MainReturnType, Player } from "shared/types/node-haxball";
import {
    AuthPlugin,
    CommandsPlugin,
    MatchHistoryPlugin,
    GamemodesPlugin,
    PajaritosBaseLib,
    PHPlayer,
    PlayerModifier,
    WebApiData,
} from "../types";
import { WebApiClient } from "./res/webApiClient";
import chroma from "chroma-js";
import { Gamemodes } from "./gamemodes";
import { GetUserDto } from "shared/types/dtos/user.dto";
import { SubscriptionDto } from "@shared/types/dtos/misc.dto";

const emojiRegex =
    /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{FE0F}])/u;

function isEmoji(char: string) {
    return emojiRegex.test(char);
}

function isHexColor(str: string) {
    return /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(str);
}

function getFirstEmoji(str: string) {
    const match = str.match(emojiRegex);
    return match ? match[0] : null;
}

export default function (API: MainReturnType, webApiData: WebApiData) {
    if (!API) API = require("node-haxball")();

    class SubsFeaturesPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;
        auth!: AuthPlugin;
        matchHistory!: MatchHistoryPlugin;
        gamemodes!: GamemodesPlugin;
        webApiClient!: WebApiClient;
        playersModifiers: PlayerModifier[] = [];
        anims = {
            grow: (player: PHPlayer) => {
                const disc = player.disc;
                const discs = this.room.getDiscs() || [];
                if (disc) {
                    let discId = discs.indexOf(disc);
                    if (discId >= 1) {
                        let r = 15;
                        let interval = setInterval(() => {
                            r += 1.25;
                            this.room.setDiscProperties(discId, { radius: r });
                        }, 75);
                        setTimeout(() => {
                            clearInterval(interval);
                        }, 1500);
                    }
                }
            },
            shrink: (player: PHPlayer) => {
                const disc = player.disc;
                const discs = this.room.getDiscs() || [];
                if (disc) {
                    let discId = discs.indexOf(disc);
                    if (discId >= 1) {
                        let r = 15;
                        let interval = setInterval(() => {
                            r -= 0.75;
                            this.room.setDiscProperties(discId, { radius: r });
                        }, 100);
                        setTimeout(() => {
                            clearInterval(interval);
                        }, 1500);
                    }
                }
            },
            /**
             * Esta función al reestablecer los colores originales corrige un bug que por algún motivo
             * divide los ángulos por 0.71 periódico, por lo cual lo multiplicamos por 1.40625
             */
            rainbow: (player: PHPlayer) => {
                let teamId = player?.team.id;
                if (!isNaN(teamId)) {
                    let origTeamColors = this.room.state.teamColors[teamId];
                    let interval = setInterval(() => {
                        let newColor = parseInt(chroma.random().saturate(3).hex().substring(1), 16);
                        this.room.setTeamColors(teamId, 0, 0, newColor);
                    }, 75);
                    setTimeout(() => {
                        clearInterval(interval);
                        this.room.setTeamColors(
                            teamId,
                            origTeamColors.angle * 1.40625,
                            origTeamColors.text,
                            ...origTeamColors.inner
                        );
                    }, 2000);
                }
            },
        };

        constructor(private webApiData: WebApiData) {
            super("lmbSubsFeatures", true, {
                version: "0.1",
                author: "lombi",
                description: `Algunas funciones especiales para los subs.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        getPlayerDiscId(playerId: number) {
            const disc = this.room.getPlayer(playerId)?.disc || null;
            if (!disc) return null;
            return this.room.getDiscs()?.indexOf(disc as Disc) || null;
        }

        applyModifiers() {
            this.playersModifiers.forEach((m) => {
                API.Utils.runAfterGameTick(() => {
                    const playerDiscId = this.getPlayerDiscId(m.playerId);
                    if (playerDiscId === null) return;
                    this.room.setDiscProperties(playerDiscId, m.discProperties);
                }, 1);
            });
        }

        updateSubscriptionData(player: PHPlayer, subscription: SubscriptionDto) {
            if (player.user) {
                player.user.subscription = {
                    tier: subscription.tier,
                    startDate: subscription.startDate,
                    scoreAnimId: subscription.scoreAnimId || 0,
                    scoreMessage: subscription.scoreMessage || "",
                    chatColor: subscription.chatColor ? parseInt(subscription.chatColor, 16) : null,
                    joinMessage: subscription.joinMessage || "",
                    emoji: subscription.emoji || "",
                };
            }
        }

        override onTeamGoal = (teamId: number) => {
            setTimeout(() => {
                const scorerId = this.matchHistory.currentMatchHistory.getLastScorerId();
                if (scorerId === null) return;
                let scorerPlayer = this.phLib.getPlayer(scorerId);
                if (scorerPlayer?.team?.id === teamId && scorerPlayer.user?.subscription) {
                    switch (scorerPlayer.user.subscription.scoreAnimId) {
                        case 1:
                            this.anims.grow(scorerPlayer);
                            break;
                        case 2:
                            this.anims.shrink(scorerPlayer);
                            break;
                        case 3:
                            this.anims.rainbow(scorerPlayer);
                            break;
                    }
                    if (scorerPlayer.user.subscription.scoreMessage) {
                        this.commands.chat.announce(
                            scorerPlayer.user.subscription.scoreMessage,
                            null,
                            "vip-message",
                            2
                        );
                    }
                }
            }, 100);
        };

        override onPositionsReset = () => {
            this.applyModifiers();
        };

        override onGameStart = () => {
            this.applyModifiers();
        };

        override onPlayerLeave = (pObj: Player) => {
            this.playersModifiers = this.playersModifiers.filter((m) => m.playerId !== pObj.id);
        };

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            this.auth = this.room.plugins.find((p) => (p as any).name === "lmbAuth") as AuthPlugin;
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            this.matchHistory = this.room.plugins.find(
                (p) => (p as any).name === "lmbMatchHistory"
            ) as MatchHistoryPlugin;
            this.gamemodes = this.room.plugins.find(
                (p) => (p as any).name === "lmbGamemodes"
            ) as GamemodesPlugin;

            if (
                !this.commands ||
                !this.auth ||
                !this.phLib ||
                !this.matchHistory ||
                !this.gamemodes
            ) {
                throw new Error("subsPlugin: No se encontraron los plugins necesarios.");
            } else {
                this.webApiClient = new WebApiClient(this.webApiData, this.phLib);

                this.commands.registerCommand(
                    "!",
                    "custom",
                    async (msg, args) => {
                        if (args.length < 2) {
                            const str =
                                "Uso:\n" +
                                "!custom color FFA1A1       || Color al chatear en formato hexadecimal (obtener en https://htmlcolorcodes.com/)\n" +
                                "!custom emoji 🕊️       || Emoji personalizado al chatear\n" +
                                "!custom mensajegol ¡Mensaje de gol!        || Mensaje personalizado al hacer un gol\n" +
                                "!custom mensajejoin ¡Ya llegué!        || Mensaje personalizado al unirse a la sala\n" +
                                "!custom reset all      ||        Resetea los datos de suscripción (emoji, mensajes, color de chat)";

                            this.commands.chat.announce(str, msg.byId, "error");
                            return;
                        }
                        const player = this.phLib.getPlayer(msg.byId);
                        if (!player) {
                            console.error("No se encontró el jugador");
                            return;
                        }

                        var updatedData;
                        var updateName = "";
                        var message = args.slice(1).join(" ");
                        switch (args[0]) {
                            case "emoji": {
                                updateName = "emoji";
                                if (!isEmoji(message)) {
                                    this.commands.chat.announce(
                                        "El emoji no es válido.",
                                        msg.byId,
                                        "error"
                                    );
                                    return;
                                }
                                updatedData = await this.webApiClient.updatePlayerSubscriptionData(
                                    msg.byId,
                                    { emoji: getFirstEmoji(message) }
                                );
                                break;
                            }
                            case "mensajegol": {
                                updateName = "mensaje de gol";
                                updatedData = await this.webApiClient.updatePlayerSubscriptionData(
                                    msg.byId,
                                    { scoreMessage: message }
                                );
                                break;
                            }
                            case "mensajejoin": {
                                updateName = "mensaje de bienvenida";
                                updatedData = await this.webApiClient.updatePlayerSubscriptionData(
                                    msg.byId,
                                    { joinMessage: message }
                                );
                                break;
                            }
                            case "color": {
                                updateName = "color de chat";
                                if (!isHexColor(message)) {
                                    this.commands.chat.announce(
                                        "El color no es válido. Podés generar un color hexadecimal (de 6 caracteres, ej: FFA1B1) en https://htmlcolorcodes.com/",
                                        msg.byId,
                                        "error"
                                    );
                                    return;
                                }
                                updatedData = await this.webApiClient.updatePlayerSubscriptionData(
                                    msg.byId,
                                    { chatColor: message }
                                );
                                break;
                            } case "reset": {
                                if (args[1] && args[1] !== "all") return;
                                updateName = "información de suscripción";
                                message = "reiniciar todos los datos"
                                updatedData = await this.webApiClient.updatePlayerSubscriptionData(
                                    msg.byId,
                                    {
                                        emoji: "",
                                        scoreMessage: "",
                                        joinMessage: "",
                                        chatColor: null,
                                    }
                                );
                            }
                        }
                        if (updatedData) {
                            console.log(updatedData)
                            this.updateSubscriptionData(player, updatedData);
                            this.commands.chat.announce(
                                `Se actualizó tu ${updateName} a: < ${message} >`,
                                msg.byId
                            );
                        } else {
                            this.commands.chat.announce(
                                "Error al actualizar la información.",
                                msg.byId,
                                "error"
                            );
                        }
                    },
                    "Actualiza los datos de la suscripción como el emoji o mensajes de celebración.",
                    false,
                    0,
                    1
                );
                this.commands.registerCommand(
                    "!",
                    "festejogol",
                    (msg, args) => {
                        if (args.length === 0) {
                            this.commands.chat.announce(
                                "[0] - Ninguno\n[1] - Agrandarse\n[2] - Encogerse\n[3] - Arcoíris\n\nUso: !festejo <id>",
                                msg.byId
                            );
                        } else {
                            let player = this.phLib.getPlayer(msg.byId);
                            if (player?.user?.subscription) {
                                if (args[0] === "0") {
                                    player.user.subscription.scoreAnimId = 0;
                                } else if (args[0] === "1") {
                                    player.user.subscription.scoreAnimId = 1;
                                    this.commands.chat.announce(
                                        "Tu nuevo festejo de gol es Agrandarse!",
                                        msg.byId
                                    );
                                } else if (args[0] === "2") {
                                    player.user.subscription.scoreAnimId = 2;
                                    this.commands.chat.announce(
                                        "Tu nuevo festejo de gol es Encogerse!",
                                        msg.byId
                                    );
                                } else if (args[0] === "3") {
                                    player.user.subscription.scoreAnimId = 3;
                                    this.commands.chat.announce(
                                        "Tu nuevo festejo de gol es Arcoíris!",
                                        msg.byId
                                    );
                                } else {
                                    this.commands.chat.announce(
                                        "El festejo elegido no existe 😕",
                                        msg.byId
                                    );
                                    return;
                                }

                                this.webApiClient.updatePlayerSubscriptionData(player.id, {
                                    scoreAnimId: player.user.subscription.scoreAnimId,
                                });
                            }
                        }
                    },
                    "Cambia la animación del festejo ante goles.",
                    false,
                    0,
                    1
                );

                this.commands.registerCommand(
                    "!",
                    "radio",
                    (msg, args) => {
                        if (this.gamemodes.gamemode === Gamemodes.Freeroam) {
                            if (args.length === 0) {
                                this.commands.chat.announce(
                                    "Uso: '!radio <número entre 5 y 30>'",
                                    msg.byId
                                );
                            } else {
                                const value = parseInt(args[0]);
                                if (isNaN(value)) {
                                    this.commands.chat.announce(
                                        "El argumento debe ser un número entero entre 5 y 30!",
                                        msg.byId,
                                        "error"
                                    );
                                    return;
                                }
                                if (value >= 5 && value <= 30) {
                                    let player = this.phLib.getPlayer(msg.byId);
                                    if (player) {
                                        var discId =
                                            this.room.getDiscs()?.indexOf(player.disc as Disc) ||
                                            -1;
                                        if (discId !== -1) {
                                            this.playersModifiers.push({
                                                playerId: player.id,
                                                discProperties: { radius: parseInt(args[0]) },
                                            });
                                            this.room.setDiscProperties(discId, {
                                                radius: parseInt(args[0]),
                                            });
                                        }
                                    }
                                } else {
                                    this.commands.chat.announce(
                                        "El número debe ser un entero entre 5 y 30! ej: ' !radio 5 '",
                                        msg.byId,
                                        "error"
                                    );
                                }
                            }
                        } else {
                            this.commands.chat.announce(
                                "🙁 Este comando solo funciona en Juegan Todos!",
                                msg.byId
                            );
                        }
                    },
                    "En las salas Juegan Todos, permite cambiar el tamaño del disco.",
                    false,
                    0,
                    0 // TODO: mover a gamemodes.ts
                );
            }
        };
    }

    return new SubsFeaturesPlugin(webApiData);
}
