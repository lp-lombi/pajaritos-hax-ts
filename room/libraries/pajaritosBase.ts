import { HaxballEvent, MainReturnType, Player } from "shared/types/node-haxball";
import { PHExtraPlayerData } from "../types";

/**
 * Direcciones de movimiento del jugador. 
 * Haxball toma el movimiento mientras se patea como uno diferente,
 * por lo cual va a ser distinto por ejemplo moverse a la izquierda que moverse pateando a la izquierda.
 */
export enum MovementDirection {
    None = 0,
    Up = 1,
    UpRight = 9,
    Right = 8,
    DownRight = 10,
    Down = 2,
    DownLeft = 6,
    Left = 4,
    KickNone = 16,
    UpLeft = 5,
    KickUp = 17,
    KickUpRight = 25,
    KickRight = 24,
    KickDownRight = 26,
    KickDown = 18,
    KickDownLeft = 22,
    KickLeft = 20,
    KickUpLeft = 21,
}

export default function (API: MainReturnType) {
    class PHPlayer {
        constructor(private player: Player, private extraData: PHExtraPlayerData) {}

        get id() {
            return this.player.id;
        }
        get name() {
            return this.player.name;
        }
        get team() {
            return this.player.team;
        }
        get disc() {
            return this.player.disc;
        }
        get auth() {
            return this.player.auth;
        }
        get isAdmin() {
            return this.player.isAdmin;
        }
        get default() {
            return this.player
        }
        get movementDirection() {
            return ((this.player as any).WD || 0) as MovementDirection;
        }
        /** El objeto que contiene la información del usuario registrado. En caso de no estar registrado, se genera un objeto con ID nulo y rol por defecto*/
        get user() {
            if (!this.extraData.user) {
                this.extraData.user = { id: null, role: 0, username: this.name };
            }
            return this.extraData.user;
        }
        get isLoggedIn() {
            return this.user.id !== null;
        }
        get comba() {
            return this.extraData.comba;
        }
        get showAds() {
            return this.extraData.showAds;
        }
        set showAds(show: boolean) {
            this.extraData.showAds = show;
        }
        get mutedPlayersIds() {
            return this.extraData.mutedPlayersIds;
        }
        set mutedPlayersIds(ids: number[]) {
            this.extraData.mutedPlayersIds = ids;
        }
        set user(user: NonNullable<PHExtraPlayerData["user"]>) {
            this.extraData.user = user;
        }
    }

    class PajaritosBaseLib extends API.Library {
        constructor(
            private playersExtraData: Map<number, PHExtraPlayerData> = new Map(),
            private onInitQueue: Array<() => void> = []
        ) {
            super("PajaritosBase", {
                version: "1.0.0",
                author: "lombi",
                description:
                    "Proporciona funcionalidades básicas para los plugins de Pajaritos, versiones extendidas de los objetos de la API de Haxball.",
            });
        }

        /**
         * Lista de jugadores de la sala (excluye al bot de Haxball).
         */
        get players() {
            const players = this.room?.players?.map((p) => {
                const extraData = this.getExtraData(p);
                return new PHPlayer(p, extraData);
            }).filter(p => p.id !== 0) || []; // Filtrar el jugador con ID 0 (el bot de Haxball)
            return players;
        }

        /**
         * Jugador bot. Este es el jugador con ID 0.
         */
        get bot() {
            const bot = this.room.getPlayer(0);
            if (bot) {
                const extraData = this.getExtraData(bot);
                return new PHPlayer(bot, extraData);
            }
            return null;
        }

        get playersAndBot() {
            const players = this.players;
            const bot = this.bot;
            if (bot) {
                players.push(bot);
            }
            return players;
        }

        onInit(callback: () => void) {
            this.onInitQueue.push(callback);
        }

        getExtraData(player: PHPlayer | Player): PHExtraPlayerData {
            const data = this.playersExtraData.get(player.id);
            if (data) {
                return data;
            } else {
                const newData: PHExtraPlayerData = {
                    user: undefined,
                    comba: { holdTicks: 0 },
                    showAds: true,
                    mutedPlayersIds: [],
                };
                this.playersExtraData.set(player.id, newData);
                return newData;
            }
        }

        getPlayer(name: string): PHPlayer | null;
        getPlayer(id: number): PHPlayer | null;
        getPlayer(identifier: string | number, includeBot = false): PHPlayer | null {
            if (typeof identifier === "string") {
                return this.playersAndBot.find((p) => p.name === identifier) || null;
            } else if (typeof identifier === "number") {
                return this.playersAndBot.find((p) => p.id === identifier) || null;
            } else {
                return null;
            }
        }

        override initialize = () => {
            this.onInitQueue.forEach((callback) => callback());
        };
    }

    return new PajaritosBaseLib();
}
