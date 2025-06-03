import {
    HaxballEvent,
    MainReturnType,
    OperationType,
    Player,
    SetDiscPropertiesParams,
    Stadium,
} from "shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib } from "../types";

export enum AutobotAfkAction {
    Move = "move",
    Kick = "kick",
    None = "none",
}

export default function (API: MainReturnType) {
    class AutobotPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;

        constructor(
            public active = true,
            // TODO: Revisar si es necesario
            public isScoring = false,
            public goalLines: {
                left: { top: { x: number; y: number }; bottom: { x: number; y: number } };
                right: { top: { x: number; y: number }; bottom: { x: number; y: number } };
            } | null = null,
            public teamSize = 4,
            public currentAfkTicks = 0,
            public requiredAfkTicks = 900,
            public decelerateFactor = 0.8,
            public ballResetThreshold = 20,
            public afkAction = AutobotAfkAction.Move,
            public inactivePlayersIds: number[] = [],
            public replaceablePlayersIds: number[] = []
        ) {
            super("lmbAutobot", true, {
                version: "0.1",
                author: "lombi",
                description: `Permite al bot administrar los partidos.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        get redTeamPlayers() {
            return this.phLib.players.filter((p) => p.team.id === 1);
        }
        get blueTeamPlayers() {
            return this.phLib.players.filter((p) => p.team.id === 2);
        }
        get spectators() {
            return this.phLib.players.filter((p) => p.team.id === 0);
        }
        get nonSpectators() {
            return this.phLib.players.filter((p) => p.team.id !== 0);
        }

        getGoalLines(stadium: Stadium) {
            let g1 = {
                top: stadium.goals[0].p0,
                bottom: stadium.goals[0].p1,
            };
            let g2 = {
                top: stadium.goals[1].p0,
                bottom: stadium.goals[1].p1,
            };

            if (g1.top.x > g2.top.x) {
                return { left: g2, right: g1 };
            } else if (g1.top.x < g2.top.x) {
                return { left: g1, right: g2 };
            } else {
                return null;
            }
        }

        checkAfk() {
            if (this.currentAfkTicks === 0) {
                this.inactivePlayersIds = this.nonSpectators
                    .map((p) => p.id)
                    .filter((id) => id > 0);
            } else if (this.currentAfkTicks >= this.requiredAfkTicks) {
                if (this.active && this.room.gameState) {
                    if (this.afkAction === "move") {
                        const spectators = this.spectators;
                        if (spectators.length > 0) {
                            for (let i = 0; i < spectators.length; i++) {
                                if (this.inactivePlayersIds[i]) {
                                    this.room.setPlayerTeam(this.inactivePlayersIds[i], 0);
                                }
                            }
                        }
                    } else if (this.afkAction === "kick") {
                        this.inactivePlayersIds?.forEach((id) => {
                            this.room.kickPlayer(
                                id,
                                `AFK ${this.requiredAfkTicks / 60} segundos`,
                                false
                            );
                        });
                    }
                }
                this.currentAfkTicks = 0;
                this.checkTeams();
                return;
            }
            this.currentAfkTicks++;
        }

        checkBallPosition() {
            try {
                if (this.goalLines) {
                    let modifyObj: Partial<SetDiscPropertiesParams> = {};
                    let ball = this.room.getBall();
                    if (ball?.pos.x + this.ballResetThreshold < this.goalLines.left.top.x) {
                        modifyObj = {
                            x: this.goalLines.left.top.x + 10,
                            y: ball.pos.y,
                        };
                        if (ball.speed.x < -1) {
                            modifyObj.xspeed = -ball.speed.x * this.decelerateFactor;
                        }
                    } else if (
                        ball &&
                        ball.pos.x - this.ballResetThreshold > this.goalLines.right.top.x
                    ) {
                        modifyObj = {
                            x: this.goalLines.right.top.x - 10,
                            y: ball.pos.y,
                        };
                        if (ball.speed.x > 1) {
                            modifyObj.xspeed = -ball.speed.x * this.decelerateFactor;
                        }
                    }

                    if (Object.keys(modifyObj).length > 0 && !this.isScoring) {
                        console.log("Reposicionando disco");
                        this.room.setDiscProperties(0, modifyObj);
                    }
                }
            } catch (e) {
                console.log("Error al verificar la posición del disco:", e);
            }
        }

        checkTeams() {
            const spectators = this.spectators.filter((p) => p.id > 0);
            const blueTeamPlayers = this.blueTeamPlayers;
            const redTeamPlayers = this.redTeamPlayers;

            if (blueTeamPlayers.length < this.teamSize || redTeamPlayers.length < this.teamSize) {
                if (spectators.length > 0) {
                    const teamToJoinId = redTeamPlayers.length <= blueTeamPlayers.length ? 1 : 2;
                    this.commands.chat.announce("Entrás al juego.", spectators[0].id, "alert");
                    this.room.setPlayerTeam(spectators[0].id, teamToJoinId);

                    if (
                        blueTeamPlayers.length < this.teamSize ||
                        redTeamPlayers.length < this.teamSize
                    ) {
                        this.checkTeams(); // Revisa nuevamente los equipos después de agregar un espectador
                    }
                } else {
                    if (Math.abs(redTeamPlayers.length - blueTeamPlayers.length) > 1) {
                        if (redTeamPlayers.length > blueTeamPlayers.length) {
                            this.room.setPlayerTeam(redTeamPlayers[0].id, 2);
                        } else {
                            this.room.setPlayerTeam(blueTeamPlayers[0].id, 1);
                        }
                    }
                }
            }
        }

        restartGame = () => {
            this.room.stopGame();
            setTimeout(() => {
                this.room.startGame();
            }, 300);
        };

        override onGameTick = () => {
            if (this.active && this.room.gameState) {
                this.checkAfk();
                this.checkBallPosition();
            }
        };

        override onPlayerJoin = (player: Player) => {
            if (this.active && this.room.gameState) {
                this.checkTeams();
            }
        };

        override onPlayerLeave = (player: Player) => {
            if (this.active && this.room.gameState) {
                this.checkTeams();
                if (this.room.players.length === 1) {
                    this.restartGame();
                }
            }
        };

        override onGameStart = (byId: number) => {
            API.Utils.runAfterGameTick(() => {
                this.checkTeams();
            }, 1)
            // A la mitad del partido se determina los jugadores elegibles para salir
            setTimeout(() => {
                this.replaceablePlayersIds = this.phLib.players
                    .filter((p) => p.id !== 0 && p.team.id > 0)
                    .map((p) => p.id);
            }, this.room.timeLimit * 60000 * 0.6);
        };

        override onGameEnd = (winningTeamId: number) => {
            if (!this.active) return;
            const loserTeamId = winningTeamId === 1 ? 2 : 1;
            let loserPlayersIds: number[] = [];

            setTimeout(() => {
                const spectators = this.spectators;

                this.replaceablePlayersIds.forEach((pId) => {
                    const player = this.phLib.getPlayer(pId);
                    if (!player) return;
                    if (player.team.id === loserTeamId) {
                        loserPlayersIds.push(player.id);
                    }
                });

                loserPlayersIds.forEach((playerId) => {
                    this.room.setPlayerTeam(playerId, 0);
                });

                // Recién luego se mueve a los especatdores al juego
                for (let i = 0; i < this.teamSize; i++)
                    if (spectators[i]) {
                        let currentTeamSize = 0;
                        this.phLib.players.forEach((p) => {
                            if (p.team.id === loserTeamId) currentTeamSize++;
                        });

                        if (currentTeamSize < this.teamSize) {
                            this.room.setPlayerTeam(spectators[i].id, loserTeamId);
                        }
                    }
                this.restartGame();
            }, 3000);
        };

        override onTeamGoal = (teamId: number) => {
            this.isScoring = true;
            setTimeout(() => {
                this.isScoring = false;
            }, 4000);
        };

        override onStadiumChange = (stadium: Stadium) => {
            this.goalLines = this.getGoalLines(stadium);
        };

        override onOperationReceived = (type: OperationType, msg: HaxballEvent) => {
            if (this.inactivePlayersIds.includes(msg.byId)) {
                this.inactivePlayersIds.splice(this.inactivePlayersIds.indexOf(msg.byId), 1);
            }
            return true;
        };

        override initialize = () => {
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;

            if (!this.phLib || !this.commands) {
                throw new Error("autobot: No se encontró el plugin PajaritosBase o Commands.");
            } else {
                this.commands.registerCommand(
                    "!",
                    "autobot",
                    (msg, args) => {
                        if (args.length === 0) {
                            this.commands.chat.announce(
                                "Uso: ' !autobot on/off ' | !autobot equipos <tamaño> | !autobot afk <segundosAfk> ",
                                msg.byId,
                                "error"
                            );
                        } else {
                            switch (args[0]) {
                                case "on":
                                    this.active = true;
                                    this.commands.chat.announce("Se activó el autobot", msg.byId);
                                    break;
                                case "off":
                                    this.commands.chat.announce(
                                        "Se desactivó el autobot",
                                        msg.byId
                                    );
                                    this.active = false;
                                    break;
                                case "equipos":
                                    if (args[1]) {
                                        const val = parseInt(args[1]);
                                        if (!isNaN(val)) {
                                            this.teamSize = val;
                                            this.checkTeams();
                                            this.commands.chat.announce(
                                                "El tamaño de los equipos cambió a " + args[1],
                                                msg.byId
                                            );
                                        }
                                    }
                                    break;
                                case "afk":
                                    if (args[1]) {
                                        if (!isNaN(parseInt(args[1]))) {
                                            this.requiredAfkTicks = parseInt(args[1]) * 60;

                                            switch (args[2]?.toLowerCase()) {
                                                case "move":
                                                    this.afkAction = AutobotAfkAction.Move;
                                                    break;
                                                case "kick":
                                                    this.afkAction = AutobotAfkAction.Kick;
                                                    break;
                                                default:
                                                    this.afkAction = AutobotAfkAction.Move;
                                                    this.commands.chat.announce(
                                                        "Acción de AFK no válida, se usará 'move' por defecto.",
                                                        msg.byId,
                                                        "error"
                                                    );
                                                    break;
                                            }

                                            this.commands.chat.announce(
                                                "El tiempo para AFK cambió a " +
                                                    args[1] +
                                                    " segundos | la acción de afk es: " +
                                                    this.afkAction,
                                                msg.byId
                                            );
                                        }
                                    } else {
                                        this.commands.chat.announce(
                                            `Tiempo AFK: ${
                                                this.requiredAfkTicks / 60
                                            }\nAcción AFK: ${
                                                this.afkAction
                                            }\n\n !afk <tiempo> <acción: kick o move>`,
                                            msg.byId
                                        );
                                    }
                                    break;
                            }
                        }
                    },
                    "Ajustes del autobot de la sala. ' !autobot on/off ' | !autobot equipos <tamaño>",
                    false,
                    2
                );
            }
        };
    }

    return new AutobotPlugin();
}
