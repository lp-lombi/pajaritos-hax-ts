import { MainReturnType } from "shared/types/node-haxball";

import { WebApiClient } from "./res/webApiClient";
import { AuthPlugin, CommandsPlugin, PajaritosBaseLib, WebApiData } from "../types";

export enum MatchHistoryEventType {
    KickBall = "KickBall",
    TouchBall = "TouchBall",
    Goal = "Goal",
    Assist = "Assist",
    GameEnd = "GameEnd",
}

export class PlayerStats {
    constructor(
        public playerId: number,
        public name: string,
        public goals: number,
        public assists: number,
        public rating: number | null = null,
        public winRate: number | null = null,
        public matches: number | null = null,
        public wins: number | null = null,
    ) {}
}

export class MatchHistoryEvent {
    static idCounter = 0;
    id: number;

    constructor(
        public playerId: number,
        public playerTeamId: number,
        public forTeamId: number,
        public type: MatchHistoryEventType,
        public time: Date
    ) {
        this.id = MatchHistoryEvent.nextId();
    }

    static nextId() {
        return MatchHistoryEvent.idCounter++;
    }
}

/**
 * Representa un conjunto de eventos que suceden en un partido, proporciona métodos para recuperrarlos,
 * almacenarlos y crear nuevas historias a través de filtros.
 */
export class MatchHistory {
    static idCounter = 0;
    id: number;

    constructor(public events: MatchHistoryEvent[] = [], public winnerTeam: number | null = null) {
        this.id = MatchHistory.nextId();
    }

    static nextId() {
        return MatchHistory.idCounter++;
    }

    registerEvent(
        playerId: number,
        playerTeamId: number,
        forTeamId: number,
        type: MatchHistoryEventType
    ) {
        this.events.push(
            new MatchHistoryEvent(playerId, playerTeamId, forTeamId, type, new Date())
        );
    }

    getEvents(
        type: MatchHistoryEventType | null = null,
        playerId: number | null = null,
        forTeamId: number | null = null
    ) {
        return this.events
            .filter((e) => (type ? e.type === type : true))
            .filter((e) => (typeof playerId === "number" ? e.playerId === playerId : true))
            .filter((e) => (forTeamId ? e.forTeamId === forTeamId : true));
    }

    // segmenta todos los eventos por ser consecutivamente el mismo playerId (los jugadores pueden repetirse)
    segmentHistoryByPlayers() {
        if (this.events.length === 0) return [];

        const segments: MatchHistoryEvent[][] = [];
        let currentSegment = [this.events[0]];

        for (let i = 1; i < this.events.length; i++) {
            if (this.events[i]?.playerId !== currentSegment[0]?.playerId) {
                segments.push(currentSegment);
                currentSegment = [this.events[i]];
            } else {
                currentSegment.push(this.events[i]);
            }
        }
        segments.push(currentSegment);

        return segments.map((segment) => new MatchHistory(segment));
    }

    getLastEvent(reverseIndex: number = 0, type: MatchHistoryEventType | null = null) {
        const events = this.getEvents(type);
        return events[events.length - reverseIndex - 1];
    }

    getLastScorerId() {
        const lastScorerEvent = this.getLastEvent(0, MatchHistoryEventType.Goal);
        if (!lastScorerEvent) return null;
        return lastScorerEvent.playerId;
    }
    getTeamPossession(teamId: number) {
        const teamEvents = this.getEvents(null, null, teamId);
        return teamEvents.length / this.events.length || 0;
    }

    getHistoryBeforeLastGoal() {
        const lastGoalEvent = this.getLastEvent(0, MatchHistoryEventType.Goal);
        if (!lastGoalEvent) return this;
        const eventsBeforeLastKickoff = this.events.slice(0, this.events.indexOf(lastGoalEvent));
        return new MatchHistory(eventsBeforeLastKickoff);
    }
    getHistorySinceLastGoal() {
        const lastGoalEvent = this.getLastEvent(0, MatchHistoryEventType.Goal);
        if (!lastGoalEvent) return this;
        const eventsSinceLastGoal = this.events.slice(this.events.indexOf(lastGoalEvent));
        return new MatchHistory(eventsSinceLastGoal);
    }
}

export default function (API: MainReturnType, webApiData: WebApiData) {
    class MatchHistoryPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        webApiClient!: WebApiClient;
        auth!: AuthPlugin;
        commands!: CommandsPlugin;
        constructor(
            public redWins = 0,
            public blueWins = 0,
            public previousMatchesHistory = new MatchHistory(),
            public currentMatchHistory = new MatchHistory(),
            public lastMatchHistory: MatchHistory | null = null
        ) {
            super("lmbMatchHistory", true, {
                description: "Historial de eventos de los partidos de la sesión.",
                author: "lombi",
                version: "0.2",
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        get goalHistory() {
            const goals = this.previousMatchesHistory.getEvents(MatchHistoryEventType.Goal);
            goals.push(...this.currentMatchHistory.getEvents(MatchHistoryEventType.Goal));
            return new MatchHistory(goals);
        }
        get assistHistory() {
            const assists = this.previousMatchesHistory.getEvents(MatchHistoryEventType.Assist);
            assists.push(...this.currentMatchHistory.getEvents(MatchHistoryEventType.Assist));
            return new MatchHistory(assists);
        }

        verifyCollissionDiscVsPlayer(
            discId1: number | null,
            discPlayerId1: number | null,
            discId2: number | null,
            discPlayerId2: number | null
        ) {
            if (
                (discId1 === 0 || discId2 === 0) &&
                (discPlayerId1 !== null || discPlayerId2 !== null)
            ) {
                const playerId = discPlayerId1 || discPlayerId2;
                if (playerId === null) return false;
                try {
                    const player = this.phLib.getPlayer(playerId);
                    if (!player || !player.team) return false;
                    const teamId = player.team.id;
                    const lastEvent = this.currentMatchHistory.getLastEvent();
                    // Solo lo registra si el último evento no fue un toque del mismo jugador
                    if (
                        lastEvent?.type !== MatchHistoryEventType.TouchBall ||
                        lastEvent?.playerId !== playerId
                    ) {
                        this.currentMatchHistory.registerEvent(
                            playerId,
                            teamId,
                            teamId,
                            MatchHistoryEventType.TouchBall
                        );
                    }
                    return true;
                } catch (error) {
                    console.error(
                        "Error al verificar la colisión del disco con el jugador:",
                        error
                    );
                    return false;
                }
            }
            return false;
        }
        getGoalScorerId(teamId: number) {
            const lastEvent = this.currentMatchHistory.getHistorySinceLastGoal().getLastEvent();
            let candidateScorer: number | null = lastEvent?.playerId;

            if (lastEvent?.type === MatchHistoryEventType.KickBall) {
                return candidateScorer;
            } else if (
                lastEvent?.type === MatchHistoryEventType.TouchBall &&
                lastEvent?.forTeamId === teamId
            ) {
                return candidateScorer;
            } else {
                const lastKickEvent = this.currentMatchHistory
                    .getHistorySinceLastGoal()
                    .getLastEvent(0, MatchHistoryEventType.KickBall);
                if (lastKickEvent?.playerId) {
                    candidateScorer = lastKickEvent?.playerId;
                } else {
                    const lastTouchEvent = this.currentMatchHistory
                        .getHistorySinceLastGoal()
                        .getLastEvent(0, MatchHistoryEventType.TouchBall);
                    if (lastTouchEvent?.playerId) {
                        candidateScorer = lastTouchEvent?.playerId;
                    } else {
                        candidateScorer = null; // No se encontró un candidato
                    }
                }
            }
            return candidateScorer;
        }
        getGoalAssisterId(teamId: number, scorerPlayerId: number | null) {
            const penultimateEvent = this.currentMatchHistory
                .getHistoryBeforeLastGoal()
                .getLastEvent(1);
            let candidateAssister: number | null = null;

            if (
                penultimateEvent?.type === MatchHistoryEventType.KickBall &&
                penultimateEvent?.playerTeamId === teamId &&
                scorerPlayerId !== penultimateEvent?.playerTeamId
            ) {
                candidateAssister = penultimateEvent?.playerId;
            } else {
                const [lastPlayerHistoryBeforeGoal, penultimatePlayerHistoryBeforeGoal] =
                    this.currentMatchHistory
                        .getHistoryBeforeLastGoal()
                        .segmentHistoryByPlayers()
                        .slice()
                        .reverse();

                if (
                    lastPlayerHistoryBeforeGoal?.events?.length > 0 &&
                    penultimatePlayerHistoryBeforeGoal?.events?.length > 0
                ) {
                    const lastPlayerTeamId = lastPlayerHistoryBeforeGoal.events[0].playerTeamId;
                    const penultimatePlayerTeamId =
                        penultimatePlayerHistoryBeforeGoal.events[0].playerTeamId;
                    if (
                        lastPlayerTeamId === penultimatePlayerTeamId &&
                        lastPlayerHistoryBeforeGoal.events.length <= 2
                    ) {
                        candidateAssister = penultimatePlayerHistoryBeforeGoal.events[0].playerId;
                        if (candidateAssister === scorerPlayerId) candidateAssister = null;
                    }
                }
            }

            return candidateAssister;
        }

        // Registra un gol y devuelve el ID del jugador. Si no se encuentra un goleador, devuelve 0.
        registerGoal(teamId: number) {
            const scorerPlayerId = this.getGoalScorerId(teamId);
            const scorerTeamId = scorerPlayerId
                ? this.phLib.getPlayer(scorerPlayerId)?.team?.id
                : null;
            this.currentMatchHistory.registerEvent(
                scorerPlayerId || 0,
                scorerTeamId || teamId,
                teamId,
                MatchHistoryEventType.Goal
            );
            return scorerPlayerId || 0;
        }

        registerAssist(teamId: number, scorerPlayerId: number) {
            const assisterPlayerId = this.getGoalAssisterId(teamId, scorerPlayerId);
            if (assisterPlayerId && typeof scorerPlayerId === "number") {
                this.currentMatchHistory.registerEvent(
                    assisterPlayerId,
                    teamId,
                    teamId,
                    MatchHistoryEventType.Assist
                );
            }
        }

        savePlayersStats(history: MatchHistory) {
            this.phLib.players.forEach((player) => {
                if (player.team.id === 0 || !player.isLoggedIn || !player.user.id) return;
                const goals = history
                    .getEvents(MatchHistoryEventType.Goal, player.id)
                    .filter(
                        (e: { forTeamId: any; playerTeamId: any }) => e.forTeamId === e.playerTeamId
                    ).length;
                const ownGoals = history
                    .getEvents(MatchHistoryEventType.Goal, player.id)
                    .filter(
                        (e: { forTeamId: any; playerTeamId: any }) => e.forTeamId !== e.playerTeamId
                    ).length;
                const assists = history.getEvents(MatchHistoryEventType.Assist, player.id).length;
                const wins = history.winnerTeam === player.team.id ? 1 : 0;
                this.webApiClient.sumUserStats(player.user.id, {
                    score: goals - ownGoals,
                    assists,
                    wins,
                    matches: 1,
                });
            });
        }

        printPlayerStats(playerStats: PlayerStats, targetId: any) {
            this.commands.chat.announce(
                "\n█ " +
                    (playerStats.rating ? `${playerStats.rating} - ` : "") +
                    `${playerStats.name}`,
                targetId,
                "announcement-big",
                0
            );

            let str = `█ Goles: ${playerStats.goals}    |    Asistencias: ${playerStats.assists}\n`;
            if (playerStats.matches && playerStats.wins && playerStats.winRate) {
                str += `█ Partidos: ${playerStats.matches}    |    Victorias: ${playerStats.wins}    |    Win Rate: ${(playerStats.winRate * 100).toFixed(2)}%\n`;
            }

            this.commands.chat.announce(str,
                targetId,
                "info",
                0
            );
        }

        printEndMatchStats() {
            const redPossessionPercent = this.currentMatchHistory.getTeamPossession(1) * 100;
            const bluePossessionPercent = this.currentMatchHistory.getTeamPossession(2) * 100;
            const redAccumGoals = this.goalHistory.events.filter(
                (event) => event.forTeamId === 1
            ).length;
            const blueAccumGoals = this.goalHistory.events.filter(
                (event) => event.forTeamId === 2
            ).length;

            const bar = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";

            setTimeout(() => {
                this.commands.chat.announce(
                    `${bar}\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀Final del partido `,
                    null,
                    "announcement-big"
                );
                this.commands.chat.announce(
                    "▌".repeat(redPossessionPercent / 3) +
                        ` - ${redPossessionPercent.toFixed(2)}% posesión Red`,
                    null,
                    "red-stats",
                    0
                );
                this.commands.chat.announce(
                    "▌".repeat(bluePossessionPercent / 3) +
                        ` - ${bluePossessionPercent.toFixed(2)}% posesión Blue`,
                    null,
                    "blue-stats",
                    0
                );
                this.commands.chat.announce(
                    `El Red lleva ganados ${this.redWins} partidos y acumulados ${redAccumGoals} goles\n El Blue lleva ganados ${this.blueWins} partidos y acumulados ${blueAccumGoals} goles\n`,
                    null,
                    "info",
                    0
                );
                this.commands.chat.announce(`${bar}`, null, "announcement-big", 0);
            }, 100);
        }

        fileMatchHistory = () => {
            // Se guarda la posesión de cada equipo
            const redPossession = this.currentMatchHistory.getTeamPossession(1);
            const bluePossession = this.currentMatchHistory.getTeamPossession(2);
            this.currentMatchHistory.getTeamPossession = (teamId: number) => {
                if (teamId === 1) return redPossession;
                if (teamId === 2) return bluePossession;
                return 0;
            };

            this.currentMatchHistory.registerEvent(0, 0, 0, MatchHistoryEventType.GameEnd);

            // Se descartan los eventos de touch ball debido a que pueden ser demasiados y ya no son de utilidad
            this.previousMatchesHistory.events.push(
                ...this.currentMatchHistory.events.filter((event) => {
                    return event?.type !== MatchHistoryEventType.TouchBall;
                })
            );

            this.lastMatchHistory = this.currentMatchHistory;
            this.currentMatchHistory = new MatchHistory();
        }

        override onTeamGoal = (teamId: any) => {
            const scorerPlayerId = this.registerGoal(teamId);
            this.registerAssist(teamId, scorerPlayerId);
        };

        override onGameEnd = (winningTeamId: number | null) => {
            this.redWins += winningTeamId === 1 ? 1 : 0;
            this.blueWins += winningTeamId === 2 ? 1 : 0;

            this.currentMatchHistory.winnerTeam = winningTeamId;
            this.savePlayersStats(this.currentMatchHistory);

            this.printEndMatchStats();

            // Espera un tick para que los otros plugins puedan usar el historial antes de archivarlo
            API.Utils.runAfterGameTick(() => {
                this.fileMatchHistory();
            }, 1);
        };

        override onGameStop = () => {
            this.fileMatchHistory();
        }

        override onPlayerBallKick = (playerId: number) => {
            const player = this.phLib.getPlayer(playerId);
            const teamId = player?.team?.id;
            if (teamId)
                this.currentMatchHistory.registerEvent(
                    playerId,
                    teamId,
                    teamId,
                    MatchHistoryEventType.KickBall
                );
        };

        override onCollisionDiscVsDisc = (
            discId1: number | null,
            discPlayerId1: number | null,
            discId2: number | null,
            discPlayerId2: number | null
        ) => {
            const collissions = { discId1, discPlayerId1, discId2, discPlayerId2 };
            if (this.verifyCollissionDiscVsPlayer(discId1, discPlayerId1, discId2, discPlayerId2))
                return;
        };

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            this.auth = this.room.plugins.find((p) => (p as any).name === "lmbAuth") as AuthPlugin;
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            this.webApiClient = new WebApiClient(webApiData, this.phLib);

            if (!this.commands || !this.phLib || !this.auth) {
                throw new Error(
                    "matchHistory: El plugin de historial de partidos requiere de la librería 'PajaritosBase', del plugin 'lmbCommands' y del plugin 'lmbAuth'."
                );
            } else {
                this.commands.registerCommand(
                    "!",
                    "stats",
                    (msg: { byId: number }, args: string | any[]) => {
                        const that = this;
                        async function printDbStats(page = 1) {
                            try {
                                if (that.auth) {
                                    const pageSize = 15;
                                    const currentSeasonId = await that.webApiClient.getCurrentSeasonId();
                                    if (!currentSeasonId) {
                                        throw new Error("No se pudo obtener la temporada actual");
                                    }
                                    // TODO: permitir filtrar por temporada
                                    const stats = (await that.webApiClient.getAllUsers(true, currentSeasonId))
                                        .filter((s) => s.stats)
                                        .sort((a, b) => b.stats!.rating - a.stats!.rating)
                                        .map(
                                            (u) =>
                                                new PlayerStats(
                                                    u.id,
                                                    u.username,
                                                    u.stats!.score,
                                                    u.stats!.assists,
                                                    u.stats!.rating,
                                                    u.stats!.wins / u.stats!.matches,
                                                    u.stats!.matches,
                                                    u.stats!.wins
                                                )
                                        );
                                    const totalPages = Math.ceil(stats.length / pageSize);
                                    const currentPage = stats
                                        .slice((page - 1) * pageSize, page * pageSize)
                                        .reverse();
                                    if (currentPage.length > 0) {
                                        currentPage.forEach((ps) =>
                                            that.printPlayerStats(ps, msg.byId)
                                        );
                                        that.commands.chat.announce(
                                            `Stats históricos de los jugadores (página ${page} de ${totalPages})`,
                                            msg.byId,
                                            "announcement-big"
                                        );
                                        that.commands.chat.announce(
                                            `Para cambiar de página  !stats <núm>  |  Para ver tus stats:  !stats yo  |  Para ver los stats de hoy:  !stats hoy`,
                                            msg.byId,
                                            "info",
                                            0
                                        );
                                    } else {
                                        that.commands.chat.announce(
                                            "No hay stats para mostrar o la página es inválida",
                                            msg.byId,
                                            "error"
                                        );
                                    }
                                }
                            } catch (error) {
                                console.log(error);
                                that.commands.chat.announce(
                                    "No se pudo obtener los stats :(",
                                    msg.byId,
                                    "error"
                                );
                            }
                        }

                        async function printUserDbStats(userId: number) {
                            const data = await that.webApiClient.getUser(userId);
                            if (!data || !data.stats) {
                                that.commands.chat.announce(
                                    "No se encontraron stats para el usuario",
                                    msg.byId,
                                    "error"
                                );
                                return;
                            }
                            const stats = new PlayerStats(
                                data.id,
                                data.username,
                                data.stats.score,
                                data.stats.assists,
                                data.stats.rating,
                                data.stats.wins / data.stats.matches,
                                data.stats.matches,
                                data.stats.wins
                            );
                            that.printPlayerStats(stats, msg.byId);
                            that.commands.chat.announce(
                                "Tus estadísticas",
                                msg.byId,
                                "announcement-big"
                            );
                        }
                        function printTodayStats() {
                            that.phLib.players.forEach((player) => {
                                const playerStats = getPlayerStats(player.id);
                                if (!playerStats) return;
                                that.printPlayerStats(playerStats, msg.byId);
                            });
                            that.commands.chat.announce(
                                "Stats de los jugadores",
                                msg.byId,
                                "announcement-big"
                            );
                        }
                        function getPlayerStats(playerId: number) {
                            const player = that.phLib.getPlayer(playerId);
                            if (!player) return null;
                            const goals = that.goalHistory
                                .getEvents(MatchHistoryEventType.Goal, playerId)
                                .filter((e) => e.forTeamId === e.playerTeamId);
                            const ownGoals = that.goalHistory
                                .getEvents(MatchHistoryEventType.Goal, playerId)
                                .filter((e) => e.forTeamId !== e.playerTeamId);
                            const assists = that.assistHistory.getEvents(
                                MatchHistoryEventType.Assist,
                                playerId
                            );
                            return new PlayerStats(
                                playerId,
                                player.name,
                                goals.length - ownGoals.length,
                                assists.length
                            );
                        }

                        if (args?.length > 0) {
                            if (args[0] === "hoy") {
                                printTodayStats();
                            } else if (args[0] === "yo") {
                                const player = that.phLib.getPlayer(msg.byId);
                                if (player?.isLoggedIn) {
                                    printUserDbStats(player.user.id!);
                                } else {
                                    this.commands.chat.announce(
                                        "Para empezar a ver tus stats iniciá sesión o registrate",
                                        msg.byId,
                                        "error"
                                    );
                                }
                            } else if (!isNaN(parseInt(args[0]))) {
                                const page = parseInt(args[0]);
                                if (page > 0) {
                                    printDbStats(page);
                                }
                            }
                        } else {
                            printDbStats();
                        }
                    },
                    "Muestra las estadísticas de los jugadores."
                );
            }
        };
    }

    return new MatchHistoryPlugin();
}
