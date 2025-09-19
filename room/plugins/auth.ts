import { CommandsPlugin, PajaritosBaseLib, PHPlayer, WebApiData } from "../types";
import { MainReturnType } from "shared/types/node-haxball";
import { WebApiClient } from "./res/webApiClient";
import { GetUserDto } from "shared/types/dtos/user.dto";

export default function (API: MainReturnType, webApiData: WebApiData) {
    class AuthPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;
        webApiClient!: WebApiClient;
        webApiData: WebApiData;
        constructor(webApiData: WebApiData) {
            super("lmbAuth", true, {
                description: "Autenticación básica para haxball.",
                author: "lombi",
                version: "0.3",
                allowFlags: API.AllowFlags.CreateRoom,
            });
            this.webApiData = webApiData;
        }

        calcDaysBetween(date1: Date, date2: Date) {
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
            const differenceInMilliseconds = Math.abs(
                date2.getTime() - date1.getTime()
            );
            return Math.floor(differenceInMilliseconds / oneDayInMilliseconds);
        }

        updateUserData(player: PHPlayer, data: GetUserDto) {
            player.user = {
                id: data.id,
                username: data.username,
                role: data.role,
            };
            if (data.subscription) {
                const daysSinceLastSub = this.calcDaysBetween(
                    new Date(data.subscription.startDate),
                    new Date()
                );
                if (data.subscription.tier >= 2 || daysSinceLastSub < 30) {
                    player.user.subscription = {
                        tier: data.subscription.tier,
                        startDate: data.subscription.startDate,
                        chatColor: data.subscription.chatColor ? parseInt(data.subscription.chatColor, 16) : null,
                        scoreAnimId: data.subscription.scoreAnimId || 0,
                        scoreMessage: data.subscription.scoreMessage || "",
                        joinMessage: data.subscription.joinMessage || "",
                        emoji: data.subscription.emoji || "",
                    };
                } else {
                    this.commands.chat.announce(
                        "Tu suscripción expiró! ☹️ Si la querés renovar entrá a nuestro discord en la sección de Vips.",
                        player.id,
                        "error"
                    );
                }
            }
            if (data.stats) {
                player.user.stats = {
                    score: data.stats.score,
                    assists: data.stats.assists,
                    matches: data.stats.matches,
                    wins: data.stats.wins,
                    rating: data.stats.rating,
                };
            }
            if (data.role >= 2) this.room.setPlayerAdmin(player.id, true);
        }

        getLoggedPlayers() {
            return this.phLib.players.filter((p) => p.isLoggedIn);
        }

        isPlayerLogged(playerId: number) {
            const p = this.phLib.getPlayer(playerId);
            return !!p && p.isLoggedIn;
        }

        isPlayerSubscribed(playerId: number) {
            const p = this.phLib.getPlayer(playerId);
            return p && p.user.subscription && p.user.subscription?.tier >= 1;
        }

        override initialize = () => {
            this.phLib = this.room.libraries.find(
                (p) => (p as any).name === "PajaritosBase"
            ) as unknown as PajaritosBaseLib;
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.commands || !this.phLib) {
                throw new Error(
                    "auth: El plugin de autenticación requiere de la librería 'PajaritosBase' y del plugin  'lmbCommands'."
                );
            }
            this.webApiClient = new WebApiClient(this.webApiData, this.phLib);

            this.commands.registerCommand(
                "!",
                "register",
                async (msg, args) => {
                    if (args.length !== 2) {
                        this.commands.chat.announce(
                            "Uso: ' !register <contraseña> <repetir contraseña> '",
                            msg.byId,
                            "error"
                        );
                    } else {
                        if (args[0] === args[1]) {
                            const player = this.phLib.getPlayer(msg.byId);
                            if (player) {
                                // TODO: mover a una función
                                try {
                                    const newUser = await this.webApiClient.requestRegister(
                                        player.name,
                                        args[0]
                                    );
                                    if (!newUser) {
                                        this.commands.chat.announce(
                                            "Error al registrarse. El usuario ya existe o hubo un error.",
                                            msg.byId,
                                            "error"
                                        );
                                        return;
                                    }
                                    this.updateUserData(player, newUser);
                                    this.commands.chat.announce("Registro exitoso! :).", msg.byId);
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        } else {
                            this.commands.chat.announce(
                                "Las contraseñas no coinciden.",
                                msg.byId,
                                "error"
                            );
                        }
                    }
                },
                "Registrarse. ' !register <contraseña> <repetir contraseña> '",
                true
            );
            this.commands.registerCommand(
                "!",
                "login",
                async (msg, args) => {
                    if (args.length !== 1) {
                        this.commands.chat.announce(
                            "Uso: ' !login <contraseña> ' | Para registrarse: ' !register <contraseña> <repetir contraseña> '",
                            msg.byId,
                            "error"
                        );
                        return;
                    }
                    const player = this.phLib.getPlayer(msg.byId);
                    if (player) {
                        if (player.isLoggedIn) {
                            this.commands.chat.announce("Ya estás logueado.", msg.byId, "error");
                            return;
                        }
                        const loggedUser = await this.webApiClient.requestLogin(
                            player.name,
                            args[0]
                        );
                        if (!loggedUser) {
                            this.commands.chat.announce(
                                "Error al iniciar sesión. Contraseña incorrecta o usuario no registrado.",
                                msg.byId,
                                "error"
                            );
                            return;
                        }
                        this.updateUserData(player, loggedUser);
                        this.commands.chat.announce("Inicio de sesión exitoso 🕊️", msg.byId);
                        setTimeout(() => {
                            if (player?.user.subscription?.joinMessage) {
                                this.commands.chat.announce(
                                    `¡Llegó ${player.user.username}!\n  - ${player.user.subscription.joinMessage}`,
                                    null,
                                    "announcement-big",
                                    2
                                );
                            }
                        }, 500);

                        console.log(
                            `Inicio de sesión: ${player.user.username}      #${player.user.id}`
                        );
                    }
                },
                "Iniciar la sesión. ' !login <contraseña> '",
                true
            );
        };
    }

    return new AuthPlugin(webApiData);
}
