import { MainReturnType } from "@shared/types/node-haxball";
import { CommandsPlugin, MatchHistoryPlugin, PajaritosBaseLib, WebApiData } from "../types";
import { WebApiClient } from "./res/webApiClient";
import { MatchHistoryEventType } from "./matchHistory";

export default function Economy(API: MainReturnType, webApiData: WebApiData) {
    class EconomyPlugin extends API.Plugin {
        commands!: CommandsPlugin;
        phLib!: PajaritosBaseLib;
        matchHistory!: MatchHistoryPlugin;
        webApiClient!: WebApiClient;
        constructor() {
            super("lmbEconomy", true, {
                version: "0.1",
                description: "Economía y transacciones.",
                author: "lombi",
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        override onGameEnd = () => {
            this.matchHistory.currentMatchHistory.events
                .filter(
                    (e) =>
                        e.type === MatchHistoryEventType.Goal ||
                        e.type === MatchHistoryEventType.Assist
                )
                .forEach((event) => {
                    console.log(event);
                    const player = this.phLib.getPlayer(event.playerId);
                    if (player && player.isLoggedIn) {
                        this.webApiClient
                            .registerTransaction(player.user.id as number, null, 1, "reward")
                            .catch((error) => {
                                console.error("Error al registrar la recompensa por gol: " + error);
                            });
                    }
                });
        };

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            this.matchHistory = this.room.plugins.find(
                (p) => (p as any).name === "lmbMatchHistory"
            ) as MatchHistoryPlugin;
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            if (!this.commands || !this.phLib || !this.matchHistory) {
                throw new Error(
                    "El plugin lmbCommands, lmbMatchHistory y la librería PajaritosBase son requeridas para lmbEconomy."
                );
            }
            this.webApiClient = new WebApiClient(webApiData, this.phLib);
            this.commands.registerCommand("!", "eco", async (msg, args) => {
                const player = this.phLib.getPlayer(msg.byId);
                if (!player || !player.isLoggedIn) {
                    return this.commands.chat.announce(
                        "Debés iniciar sesión para ver tu saldo.",
                        msg.byId,
                        "error"
                    );
                }
                if (args.length === 0) {
                    try {
                        const userData = await this.webApiClient.getUser(player.user.id as number);
                        if (!userData) {
                            return this.commands.chat.announce(
                                "No se encontró tu usuario en la base de datos.",
                                msg.byId,
                                "error"
                            );
                        }
                        this.commands.chat.announce(
                            `Saldo: ${userData.wallet.balance} Exes\nTotal acreditado: ${userData.wallet.totalEarned} Exes\nTotal debitado: ${userData.wallet.totalSpent} Exes\n\n
                            Usa !eco t <usuario exacto> <monto> para transferir Exes a otro usuario.`,
                            msg.byId
                        );
                    } catch (error) {
                        console.error("Error al obtener datos del usuario para economía: " + error);
                        return this.commands.chat.announce(
                            "Error al obtener el saldo. Intentá de nuevo más tarde.",
                            msg.byId,
                            "error"
                        );
                    }
                } else if (args[0].toLowerCase() === "t" || args[0].toLowerCase() === "transferir") {
                    if (args.length < 3) {
                        return this.commands.chat.announce(
                            "Uso: !eco t <usuario exacto> <monto>",
                            msg.byId,
                            "error"
                        );
                    }
                    const amount = parseInt(args[args.length - 1]);
                    if (isNaN(amount) || amount <= 0) {
                        return this.commands.chat.announce(
                            "El monto debe ser un número positivo.",
                            msg.byId,
                            "error"
                        );
                    }
                    const toUsername = args.slice(1, args.length - 1).join(" ");
                    if (toUsername.length < 3) {
                        return this.commands.chat.announce(
                            "El nombre de usuario es demasiado corto.",
                            msg.byId,
                            "error"
                        );
                    }
                    if (toUsername === player.user.username) {
                        return this.commands.chat.announce(
                            "No podés transferirte créditos a vos mismo.",
                            msg.byId,
                            "error"
                        );
                    }
                    const users = await this.webApiClient.getAllUsers();
                    console.log(users);
                    const toUser = users.find((u) => u.username === toUsername);
                    if (!toUser) {
                        return this.commands.chat.announce(
                            `No se encontró el usuario "${toUsername}". Asegurate de escribir el nombre exacto.`,
                            msg.byId,
                            "error"
                        );
                    }
                    try {
                        const transactionResult = await this.webApiClient.registerTransaction(
                            toUser.id,
                            player.user.id as number,
                            amount,
                            "transfer"
                        );
                        if (typeof transactionResult === "string") {
                            return this.commands.chat.announce(
                                transactionResult,
                                msg.byId,
                                "error"
                            );
                        } else if (!transactionResult) {
                            throw new Error("Transacción fallida sin error explícito.");
                        }
                        this.commands.chat.announce(
                            `Transferencia exitosa: Le enviaste ${amount} Exes a ${toUser.username}.`,
                            msg.byId
                        );
                    } catch (error) {
                        console.error("Error al procesar la transacción: " + error);
                        return this.commands.chat.announce(
                            "Error al procesar la transacción. Intentá de nuevo más tarde.",
                            msg.byId,
                            "error"
                        );
                    }
                }
            });
        };
    }
    return new EconomyPlugin();
}
