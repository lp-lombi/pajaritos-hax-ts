import { MainReturnType } from "@shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib, PHPlayer } from "../types";

export type VoteValue = "si" | "no" | "blanco";

export interface Vote {
    playerId: number;
    value: VoteValue;
    election: Election;
}

export class Election {
    static idIndex = 0;
    id: number = Election.idIndex++;
    constructor(
        public description: string,
        private onFinish: (result: boolean) => void,
        private onVote = (vote: Vote) => {},
        private onDuplicateVote = (duplicateVote: Vote) => {},
        public requiredVotes: number = 1,
        public durationMs: number = 45000,
        public votes: Vote[] = []
    ) {
        setTimeout(() => {
            const positiveVotes = this.votes.filter((v) => v.value === "si").length;
            this.onFinish(positiveVotes >= this.requiredVotes)
        }, this.durationMs);
    }

    get affirmativeVotes() {
        return this.votes.filter((v) => v.value === "si");
    }

    get negativeVotes() {
        return this.votes.filter((v) => v.value === "no");
    }

    get blankVotes() {
        return this.votes.filter((v) => v.value === "blanco");
    }

    addVote(value: VoteValue, playerId: number) {
        const existingVote = this.votes.find((v) => v.playerId === playerId);
        if (existingVote) {
            this.onDuplicateVote(existingVote);
            return;
        }
        const vote = { playerId, value, election: this};
        this.votes.push(vote);
        this.onVote(vote);
    }

    deleteVote(playerId: number) {
        const index = this.votes.findIndex((v) => v.playerId === playerId);
        if (index !== -1) {
            this.votes.splice(index, 1);
        }
    }
}

export default function Votes(API: MainReturnType) {
    class VotesPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;

        constructor(public currentElection: Election | null = null) {
            super("lmbVotes", true, {
                version: "0.1",
                author: "lombi",
                description: `Plugin para votar kickear jugadores.`,
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
                console.log("El plugin de votos requiere de PajaritosBase y lmbCommands.");
            } else {
                this.commands.registerCommand(
                    "!",
                    "vote",
                    (msg, args) => {
                        if (args.length === 0) {
                            if (!this.currentElection) {
                                let str = "No hay votaciones activas.\n\n";
                                str += "Para iniciar una votación, usa: !vote <acción>\n";
                                str += "Acciones disponibles: kick.";
                                this.commands.chat.announce(str, msg.byId);
                            } else {
                                this.commands.chat.announce(
                                    `Votación activa: ${this.currentElection.description}\n` +
                                        ` - Votos afirmativos: ${this.currentElection.affirmativeVotes.length}/${this.currentElection.requiredVotes}\n` +
                                        ` - Duración: ${Math.round(
                                            this.currentElection.durationMs / 1000
                                        )} segundos`,
                                    msg.byId
                                );
                            }
                        } else {
                            const voteCaller = this.phLib.getPlayer(msg.byId);
                            if (!voteCaller)
                                return console.error("votes: no se encontró al votador.");
                            switch (args[0].toLowerCase()) {
                                case "si":
                                case "no":
                                case "blanco": {
                                    if (this.currentElection) {
                                        const voteValue: VoteValue =
                                            args[0].toLowerCase() as VoteValue;
                                        this.currentElection.addVote(voteValue, msg.byId);
                                    } else {
                                        this.commands.chat.announce(
                                            "No hay una votación activa.",
                                            msg.byId
                                        );
                                    }
                                    break;
                                }
                                case "kick": {
                                    if (this.currentElection) {
                                        return this.commands.chat.announce(
                                            `Ya hay una votación activa: ${this.currentElection.description}`,
                                            msg.byId
                                        );
                                    }
                                    if (args.length < 2) {
                                        let str = this.commands.chat.getPlayersIdsString(
                                            this.phLib.players
                                        );
                                        str +=
                                            "\n\nInicia una votación para kickear a un jugador. Ejemplo: !vote kick <id>";
                                        this.commands.chat.announce(str, msg.byId);
                                    } else {
                                        const targetId = parseInt(args[1]);
                                        if (isNaN(targetId)) {
                                            this.commands.chat.announce(
                                                "ID inválido. Usa un número válido.",
                                                msg.byId
                                            );
                                            return;
                                        }
                                        const toKickPlayer = this.phLib.getPlayer(targetId);
                                        if (!toKickPlayer) {
                                            this.commands.chat.announce(
                                                `Jugador con ID ${targetId} no encontrado.`,
                                                msg.byId
                                            );
                                            return;
                                        }
                                        this.currentElection = new Election(
                                            `kickear a " ${toKickPlayer.name} "`,
                                            (result) => {
                                                let str = "Resultado de la votación:\n\n";
                                                str += result
                                                    ? `El pueblo decidió fusilar a ${toKickPlayer.name}.`
                                                    : `No se kickea a ${toKickPlayer.name}.`;
                                                this.commands.chat.announce(str, null, "alert");

                                                if (result) {
                                                    setTimeout(() => {
                                                        this.room.kickPlayer(
                                                            targetId,
                                                            "Fusilado por votación.",
                                                            false
                                                        );
                                                    }, 3000);
                                                }
                                                this.currentElection = null;
                                            },
                                            (vote) => {
                                                const voter = this.phLib.getPlayer(vote.playerId);
                                                if (!voter) {
                                                    console.error(
                                                        `votes: no se encontró al votante con ID ${vote.playerId}.`
                                                    );
                                                    return;
                                                }
                                                this.commands.chat.announce(
                                                    `${voter.name} votó < ${vote.value} > a ${vote.election.description} | ${vote.election.affirmativeVotes.length}/${vote.election.requiredVotes} votos afirmativos`,
                                                    null,
                                                    "info",
                                                    2
                                                );
                                            },
                                            (duplicateVote) => {
                                                this.commands.chat.announce(`Ya votaste " ${duplicateVote.value} ".`, msg.byId, "error");
                                            },
                                            Math.round(this.phLib.players.length * 0.6)
                                        );

                                        this.commands.chat.announce(
                                            `Votación iniciada por ${voteCaller.name}.`,
                                            null,
                                            "hint",
                                            2
                                        );
                                        let str = `VOTACIÓN PARA KICKEAR A " ${toKickPlayer.name} "\n`;
                                        str += `${
                                            this.currentElection.durationMs / 1000
                                        } segundos para votar.\n\n`;
                                        str += `Para votar usá: ' !vote si ' o ' !vote no `;
                                        this.commands.chat.announce(str, null, "alert", 0);
                                    }
                                    break;
                                }
                                default: {
                                    this.commands.chat.announce(
                                        `Acción "${args[0]}" no reconocida. Usa !vote para ver las acciones disponibles.`,
                                        msg.byId
                                    );
                                    break;
                                }
                            }
                        }
                    },
                    "Inicia una votación. Ejemplo: !vote kick"
                );
            }
        };
    }

    return new VotesPlugin();
}
