import { HaxballEvent, MainReturnType, Player } from "shared/types/node-haxball";
import { PHExtraPlayerData } from "shared/types/room";

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
        get isAdmin() {
            return this.player.isAdmin;
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

        get players() {
            const players: PHPlayer[] = this.room.players.map((p) => {
                const extraData = this.getExtraData(p);
                return new PHPlayer(p, extraData);
            });
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
                };
                this.playersExtraData.set(player.id, newData);
                return newData;
            }
        }

        getPlayer(name: string): PHPlayer | null;
        getPlayer(id: number): PHPlayer | null;
        getPlayer(identifier: string | number): PHPlayer | null {
            if (typeof identifier === "string") {
                return this.players.find((p) => p.name === identifier) || null;
            } else if (typeof identifier === "number") {
                return this.players.find((p) => p.id === identifier) || null;
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