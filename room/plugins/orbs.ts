import { Disc, MainReturnType, Stadium } from "@shared/types/node-haxball";
import { CommandsPlugin } from "../types";

export default function (API: MainReturnType) {
    class OrbsPlugin extends API.Plugin {
        commands!: CommandsPlugin;
        constructor(
            private isPluginActive = true,
            public G = 0.25,
            public attractMultiplier = 1,
            public repelMultiplier = 0.5,
            public targetPlayerId: number | null = null
        ) {
            super("lmbOrbs", true, {
                version: "0.1",
                author: "lombi",
                description: `Orbes que orbitan!`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        getOrbs() {
            const discs = this.room.getDiscs()?.filter((disc) => disc.radius == 4.0001);
            return discs ? discs : [];
        }

        discOrbitDisc(disc: Disc, orb: Disc) {
            if (this.isPluginActive) {
                const orbId = this.room.getDiscs().indexOf(orb);

                // Calcular la distancia entre discos y normalizar el vector
                const distanceX = disc.pos.x - orb.pos.x;
                const distanceY = disc.pos.y - orb.pos.y;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                const normalizedDirectionX = distanceX / distance;
                const normalizedDirectionY = distanceY / distance;

                // Gravedad inversamente proporcional a la distancia
                const force = this.G * distance;

                // Calcular las aceleraciones hacia el centro de la órbita
                let ax2 = ((force * normalizedDirectionX) / distance) * this.attractMultiplier;
                let ay2 = ((force * normalizedDirectionY) / distance) * this.attractMultiplier;

                /*             // Alejarlo para mantenerlo en órbita
            ax2 -= (normalizedDirectionX / distance) * this.repelMultiplier;
            ay2 -= (normalizedDirectionY / distance) * this.repelMultiplier; */

                API.Utils.runAfterGameTick(() => {
                    this.room.setDiscProperties(orbId, {
                        xgravity: ax2,
                        ygravity: ay2,
                    });
                }, 1);
            }
        }

        override onStadiumChange = (stadium: Stadium) => {
            if (this.isPluginActive) {
                let orb1 = this.room.createDisc({
                    pos: [-1000, -1000],
                    radius: 4.0001,
                    cGroup: 0 as any,
                    color: parseInt("AA33AA", 16) as any,
                });
                let orb2 = this.room.createDisc({
                    pos: [0, -1000],
                    radius: 4.0001,
                    cGroup: 0 as any,
                    color: parseInt("56EE04", 16) as any,
                });
                let orb3 = this.room.createDisc({
                    pos: [1000, -1000],
                    radius: 4.0001,
                    cGroup: 0 as any,
                    color: parseInt("04EEEA", 16) as any,
                });
                stadium.discs.push(orb1);
                stadium.discs.push(orb2);
                stadium.discs.push(orb3);
            }
        };

        override onGameTick = () => {
            if (this.isPluginActive && this.targetPlayerId !== null) {
                const playerDisc = this.room.getPlayer(this.targetPlayerId)?.disc;
                const orbs = this.getOrbs();
                if (playerDisc && orbs[0]) {
                    orbs.forEach((orb) => {
                        this.discOrbitDisc(playerDisc, orb);
                    });
                }
            }
        };

        override onGameStart = () => {
            if (this.isPluginActive && this.targetPlayerId !== null) {
                const playerDisc = this.room.getPlayerDisc(this.targetPlayerId);
                if (playerDisc) {
                    API.Utils.runAfterGameTick(() => {
                        this.getOrbs().forEach((orb) => {
                            this.room.setDiscProperties(this.room.getDiscs().indexOf(orb), {
                                x: playerDisc.pos.x + Math.random() * 50,
                                y: playerDisc.pos.y + Math.random() * 50,
                            });
                        });
                    }, 1);
                }
            }
        };

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.commands) {
                throw new Error("El plugin de orbes requiere del plugin de comandos.");
            } else {
                this.commands.registerCommand(
                    "!",
                    "orb",
                    (msg, args) => {
                        if (args.length === 0) {
                            var str = this.commands.chat.getPlayersIdsString(
                                this.commands.phLib.players
                            );
                            str += "\n !orb <id> para enviar orbes a ese jugador.";
                            this.commands.chat.announce(str, msg.byId);
                        } else if (!isNaN(parseInt(args[0]))) {
                            this.targetPlayerId = parseInt(args[0]);
                        } else if (args[0] === "off") {
                            this.isPluginActive = false;
                            this.commands.chat.announce("Orbes desactivados.", msg.byId);
                            API.Utils.runAfterGameTick(() => {
                                this.getOrbs().forEach((orb) => {
                                    let randomXPos = Math.random() * 1000;
                                    let sign = Math.random() < 0.5 ? -1 : 1;
                                    this.room.setDiscProperties(this.room.getDiscs().indexOf(orb), {
                                        x: randomXPos * sign,
                                        y: -1000,
                                        xspeed: 0,
                                        yspeed: 0,
                                        xgravity: 0,
                                        ygravity: 0,
                                    });
                                });
                                this.targetPlayerId = null;
                            }, 1);
                        } else if (args[0] === "on") {
                            this.isPluginActive = true;
                            this.commands.chat.announce("Orbes activados.", msg.byId);
                        }
                    },
                    "Envía orbes a un jugador. !orb id",
                    true,
                    2
                );
            }
        };
    }

    return new OrbsPlugin();
}
