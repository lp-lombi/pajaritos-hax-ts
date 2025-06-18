import type { MainReturnType } from "shared/types/node-haxball";
import { AnnouncementStyle, CommandsPlugin, PajaritosBaseLib, PHPlayer } from "../types";

interface MutedPlayer {
    id: number;
    auth: string | null;
    name: string;
    minutes: number;
}

export default function (API: MainReturnType) {
    class ChatbordPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;
        constructor(
            private readonly colors = {
                white: parseInt("D9D9D9", 16),
                beige: parseInt("EAD9AA", 16),
                pink: parseInt("EAB2AA", 16),
                red: parseInt("EA5F60", 16),
                green: parseInt("90F06A", 16),
                gray: parseInt("CCCBCB", 16),
                lime: parseInt("CCE9C1", 16),
                lightOrange: parseInt("FFC977", 16),
                orange: parseInt("FFB84C", 16),
                redTeam: parseInt("FFD9D9", 16),
                redTeamVip: parseInt("FFA1A1", 16),
                blueTeam: parseInt("DBD9FF", 16),
                blueTeamVip: parseInt("A1A1FF", 16),
                vip: parseInt("FFDCB3", 16),
                redStats: parseInt("FF9999", 16),
                blueStats: parseInt("9999FF", 16),
            },
            public chatLog: { text: string; color: number; style: string }[] = [],
            public mutedPlayers: MutedPlayer[] = []
        ) {
            super("lmbChatbord", true, {
                version: "1.0-ts",
                author: "lombi",
                description: `Controlador de operaciones de E/S a través del chat. MAGA.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        /**
         * Determina si un jugador está silenciado, primero por el ID en la sala y luego por el string de auth.
         */
        isPlayerMuted(player: PHPlayer) {
            let isMuted = this.mutedPlayers.some((p) => p.id === player.id);
            if (!isMuted && player.auth) {
                // Si no se encontró por ID, se busca por auth
                isMuted = this.mutedPlayers.some((p) => p.auth === player.auth);
            }
            return isMuted;
        }

        /** Comunicación emitida directamente por un jugador */
        chat(msg: string, byId: number) {
            const player = this.phLib.playersAndBot.find((p) => p.id === byId);
            if (!player) return;
            if (this.isPlayerMuted(player)) {
                return this.announce(
                    "No podés enviar mensajes porque estás silenciado.",
                    player.id,
                    "error"
                );
            }
            var loggedEmoji = player.isLoggedIn ? "✔️ " : "      ";
            if (player.user.subscription) {
                const emoji = player.user.subscription.emoji;
                if (emoji) {
                    loggedEmoji = emoji + " ";
                } else {
                    loggedEmoji = "⭐ ";
                }
            }
            const ballEmoji = player.team.id === 1 ? "🔴" : player.team.id === 2 ? "🔵" : "⚪";

            let chatColor: number;
            if (player.user?.subscription?.chatColor) {
                chatColor = player.user.subscription.chatColor;
            } else if (player.team.id === 1) {
                chatColor = player.user.subscription ? this.colors.redTeamVip : this.colors.redTeam;
            } else if (player.team.id === 2) {
                chatColor = player.user.subscription
                    ? this.colors.blueTeamVip
                    : this.colors.blueTeam;
            } else {
                chatColor = player.user.subscription ? this.colors.vip : this.colors.white;
            }

            const str = `${loggedEmoji}[${ballEmoji}] ${player.name}: ${msg}`;

            this.phLib.playersAndBot.forEach((p) => {
                if (p.mutedPlayersIds.includes(byId)) {
                    return;
                }
                this.room.sendAnnouncement(str, p.id, chatColor, 1, 1);
            });
            this.logChat(str, chatColor, "small-bold");
        }

        privateChat(msg: string, targetId: number, byId: number) {
            const targetPlayer = this.phLib.getPlayer(targetId);
            const byPlayer = this.phLib.getPlayer(byId);
            if (!targetPlayer || !byPlayer) return;
            const loggedEmoji = byPlayer.isLoggedIn ? "✔️ " : "      ";
            this.room.sendAnnouncement(
                `${loggedEmoji} ${byPlayer.name} [Mensaje privado]: ${msg}`,
                targetId,
                this.colors.lightOrange,
                "bold" as unknown as any,
                1
            );
            this.room.sendAnnouncement(
                `${loggedEmoji} ${byPlayer.name} [Mensaje privado a ${targetPlayer.name}]: ${msg}`,
                byId,
                this.colors.lightOrange,
                "bold" as unknown as any,
                1
            );

            if (targetId === 0 || byId === 0) {
                this.logChat(
                    `${loggedEmoji} ${byPlayer.name} [Mensaje privado a ${targetPlayer.name}]: ${msg}`,
                    this.colors.lightOrange,
                    "bold"
                );
            }
        }

        // TODO: la firma del estilo está mal definido en la API, se fuerza el tipo
        /** Anuncio del servidor o en respuesta a la acción de un jugador */
        announce(
            msg: string,
            targetId: number | null = null,
            type: AnnouncementStyle = "info",
            sound: 0 | 1 | 2 = 1
        ) {
            var style: [number, number] = [this.colors.beige, "small-bold" as unknown as number];
            switch (type) {
                case "info-big":
                    style = [this.colors.beige, "bold" as unknown as number];
                    break;
                case "announcement":
                    style = [this.colors.green, "small-bold" as unknown as number];
                    break;
                case "announcement-big":
                    style = [this.colors.green, "bold" as unknown as number];
                    break;
                case "hint":
                    style = [this.colors.gray, "small-bold" as unknown as number];
                    break;
                case "error":
                    style = [this.colors.pink, "small-bold" as unknown as number];
                    break;
                case "warn":
                    style = [this.colors.red, "bold" as unknown as number];
                    break;
                case "alert":
                    style = [this.colors.orange, "bold" as unknown as number];
                    break;
                case "red-stats":
                    style = [this.colors.redStats, "small-bold" as unknown as number];
                    break;
                case "blue-stats":
                    style = [this.colors.blueStats, "small-bold" as unknown as number];
                    break;
                case "vip-message":
                    style = [this.colors.vip, "bold" as unknown as number];
                    break;
            }
            this.room.sendAnnouncement(msg, targetId, ...style, sound);
            if (targetId === 0 || targetId === null) {
                this.logChat(msg, style[0], style[1] as unknown as string);
            }
        }

        logChat(text: string, color: number, style: string) {
            const maxLines = 50;
            this.chatLog.push({ text, color, style });
            maxLines > this.chatLog.length
                ? null
                : this.chatLog.splice(0, this.chatLog.length - maxLines);
        }

        getPlayersIdsString(players: PHPlayer[]) {
            return players
                .filter((p) => p.id !== 0)
                .map((p) => `[${p.id}] ${p.name}`)
                .join("\n");
        }

        override initialize = () => {
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as unknown as PajaritosBaseLib;
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.phLib || !this.commands)
                throw new Error("chat: No se encontró PajaritosBase o Commands plugin");
            this.commands.registerCommand(
                "!",
                "mute",
                (msg, args) => {
                    if (args.length < 1) {
                        this.announce(this.getPlayersIdsString(this.phLib.players), msg.byId);
                        return this.announce("Uso: !mute <ID>. Para desmutearlo, repetí el mismo comando.", msg.byId, "info", 0);
                    }
                    const target = this.phLib.getPlayer(parseInt(args[0]));
                    const player = this.phLib.getPlayer(msg.byId);
                    if (!target) {
                        return this.announce("Jugador no encontrado", msg.byId, "error");
                    }
                    if (target.id === 0) {
                        return this.announce("No podés silenciar al bot", msg.byId, "error");
                    }
                    if (target.id === msg.byId) {
                        return this.announce("No podés silenciarte a vos mismo", msg.byId, "error");
                    }
                    if (player) {
                        if (player.mutedPlayersIds.includes(target.id)) {
                            player.mutedPlayersIds = player.mutedPlayersIds.filter((id) => id !== target.id);
                            return this.announce(`Jugador ${target.name} (${target.id}) desmutado`, msg.byId, "info");
                        }
                        player.mutedPlayersIds.push(target.id);
                        this.announce(`Jugador ${target.name} (${target.id}) muteado`, msg.byId, "info")
                    }

                },
                "Dejar de recibir los mensajes de un jugador (el otro jugador no se entera)",
            );
            this.commands.registerCommand(
                "!",
                "muteall",
                (msg, args) => {
                    if (args.length < 1) {
                        this.announce(this.getPlayersIdsString(this.phLib.players), msg.byId);
                        return this.announce("Uso: !muteall <ID> <Minutos (1 a 10, por defecto 3)>", msg.byId, "info", 0);
                    }
                    const target = this.phLib.getPlayer(parseInt(args[0]));
                    if (!target) {
                        return this.announce("Jugador no encontrado", msg.byId, "error");
                    }
                    if (target.id === 0) {
                        return this.announce("No podés silenciar al bot", msg.byId, "error");
                    }
                    let minutes = 3; // Valor por defecto
                    if (args[1]) {
                        minutes = parseInt(args[1]);
                    }
                    if (isNaN(minutes) || minutes < 1 || minutes > 10) {
                        return this.announce(
                            "Solo se permite silenciar de 1 a 10 minutos.",
                            msg.byId,
                            "error"
                        );
                    }
                    this.mutedPlayers.push({
                        id: target.id,
                        auth: target.auth,
                        name: target.name,
                        minutes,
                    });
                    setTimeout(() => {
                        this.mutedPlayers = this.mutedPlayers.filter((p) => p.id !== target.id);
                        const mutedPlayer = this.phLib.getPlayer(target.id);
                        if (mutedPlayer) {
                            this.announce(
                                "Ya no estás silenciado",
                                mutedPlayer.id,
                            )
                        }
                    }, minutes * 60 * 1000);
                    this.announce(
                        `Jugador ${target.name} (${target.id}) silenciado por ${minutes} minutos`,
                        msg.byId,
                        "info"
                    );
                    this.announce(`Fuiste silenciado por ${minutes} minutos por un administrador`, target.id, "warn", 2);
                },
                "Silencia a un jugador para todos",
                false,
                1
            );
        };
    }

    return new ChatbordPlugin();
}
