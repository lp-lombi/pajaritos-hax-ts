import { MainReturnType } from "@shared/types/node-haxball";
import { WebhookClient } from "discord.js";
import { MatchHistoryPlugin } from "../types";


//TODO: Momentaneamente se ajusta de forma manual
const WH_URL = "";

const whClient = new WebhookClient({
    url: WH_URL
})

export default function (API: MainReturnType) {
    class DWHReplays extends API.Plugin {
        hist!: MatchHistoryPlugin;
        constructor(private isRecording = false) {
            super("lmbDWHReplays", true, {
                version: "0.1",
                author: "lombi",
                description: "Plugin para la grabación de los partidos y envío a Discord",
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        sendReplay = async (data: Uint8Array<ArrayBufferLike>) => {
            // Convierte Uint8Array a Buffer
            const buffer = Buffer.from(data);

            const date = new Date();

            const pad = (n: number) => n.toString().padStart(2, "0");
            const filename = `PH ${pad(date.getFullYear() % 100)}-${pad(date.getMonth() + 1)}-${pad(
                date.getDate()
            )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

            console.log(this.hist.currentMatchHistory.getTeamPossession(1))

            await whClient.send({
                content: "## PH Replay 🕊️",
                embeds: [
                    {
                        title: "Información del partido",
                        fields: [
                            {
                                name: "Jugadores",
                                value:
                                    this.room.players
                                        .filter((p) => p.id > 0)
                                        .map((p) => p.name)
                                        .join("  -  ") || "Ninguno",
                                inline: false,
                            },
                            {
                                name: "Estadística\n",
                                value: "Resultado\n\nPosesión",
                                inline: true,
                            },
                            {
                                name: "🔴 Rojo\n",
                                value:
                                    this.room.redScore +
                                    "\n\n" +
                                    (this.hist.lastMatchHistory
                                        ? this.hist.lastMatchHistory.getTeamPossession(1) * 100 + "%"
                                        : "N/A") ,
                                inline: true,
                            },
                            {
                                name: "🔵 Azul\n",
                                value:
                                    this.room.blueScore +
                                    "\n\n" +
                                    (this.hist.lastMatchHistory
                                        ? this.hist.lastMatchHistory.getTeamPossession(2) * 100 + "%"
                                        : "N/A"),
                                inline: true,
                            },
                        ],
                    },
                ],
            });

            await whClient.send({
                files: [
                    {
                        attachment: buffer,
                        name: `${filename}.hbr2`,
                    },
                ],
            });
        };

        handleRecording = () => {
            if (this.isRecording) {
                const data = this.room.stopRecording();
                // Solo se manda si hay más 2 jugadores (el bot no cuenta)
                if (data && this.room.players.length > 2) {
                    this.sendReplay(data);
                    return;
                }
                console.error("DWHR: No se pudo obtener el replay del partido.");
            }
        };

        override onGameStart = () => {
            this.room.startRecording();
            this.isRecording = true;
        };

        override onGameEnd = () => {
            this.handleRecording();
        };

        override onGameStop = () => {
            this.handleRecording();
        };

        override initialize= () => {
            this.hist = this.room.plugins.find(p => (p as any).name === "lmbMatchHistory") as MatchHistoryPlugin;
            if (!this.hist) {
                throw new Error("DWHR: No se encontró el plugin de historial de partidos.");
            }
        }
    }

    return new DWHReplays();
}
