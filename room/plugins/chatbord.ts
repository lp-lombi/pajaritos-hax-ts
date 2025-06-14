import type { MainReturnType } from "shared/types/node-haxball";
import { AnnouncementStyle, PajaritosBaseLib, PHPlayer } from "../types";

export default function (API: MainReturnType) {
    class ChatbordPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
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
            public mutedPlayersIds: number[] = []
        ) {
            super("lmbChatbord", true, {
                version: "1.0-ts",
                author: "lombi",
                description: `Controlador de operaciones de E/S a través del chat. MAGA.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        /** Comunicación emitida directamente por un jugador */
        chat(msg: string, byId: number, targetId: number | null = null) {
            const player = this.phLib.playersAndBot.find((p) => p.id === byId);
            if (!player) return;
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

            let teamColor: number;
            if (player.team.id === 1) {
                teamColor = player.user.subscription ? this.colors.redTeamVip : this.colors.redTeam;
            } else if (player.team.id === 2) {
                teamColor = player.user.subscription ? this.colors.blueTeamVip : this.colors.blueTeam;
            }
            else {
                teamColor = player.user.subscription ? this.colors.vip : this.colors.white;
            }

            const str = `${loggedEmoji}[${ballEmoji}] ${player.name}: ${msg}`;

            this.room.sendAnnouncement(str, targetId, teamColor, 1, 1);
            this.logChat(str, teamColor, "small-bold");
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
            if (!this.phLib) throw new Error("chat: No se encontró el plugin lmbPajaritosBase");
        };
    }

    return new ChatbordPlugin();
}
