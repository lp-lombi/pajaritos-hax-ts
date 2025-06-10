import { MainReturnType, MovableDisc } from "@shared/types/node-haxball";
import { CommandsPlugin } from "../types";

export default function (API: MainReturnType) {
    class CustomDiscPlugin extends API.Plugin {
        commands!: CommandsPlugin;

        constructor(public active = true) {
            super("lmbCustomDisc", true, {
                version: "0.1",
                author: "lombi",
                description: `Plugin manipular discos.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        getAllDiscs() {
            let discs = this.room.getDiscs() ? this.room.getDiscs() : [];
            return discs;
        }

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;

            if (!this.commands) {
                throw new Error("El plugin de discos requiere del plugin de comandos.");
            } else {
                this.commands.registerCommand(
                    "!",
                    "cd",
                    (msg, args) => {
                        if (args.length !== 3) {
                            if (args[0]) {
                                if (args[0] === "lock") {
                                    this.active = !this.active;
                                }
                            } else {
                                let discs = this.getAllDiscs();
                                let str = "[0] Pelota\n";
                                discs.forEach((d) => {
                                    const pId = (d as any).playerId as number;
                                    if (pId !== null) {
                                        str += `[${pId}] - ${this.room.getPlayer(pId).name}\n`;
                                    }
                                });
                                str +=
                                    "\nUso: !cd <id> <opcion> <valor>\n\nOpciones:\nr -> radio | v -> velocidad";
                                this.commands.chat.announce(str, msg.byId);
                            }
                        } else {
                            if (this.active) {
                                if (args[0] === "0") {
                                    if (args[1] === "r" && !isNaN(parseInt(args[2]))) {
                                        this.room.setDiscProperties(parseInt(args[0]), {
                                            radius: parseInt(args[2]),
                                        });
                                    }
                                } else if (!isNaN(parseInt(args[0]))) {
                                    let player = this.room.getPlayer(parseInt(args[0]));
                                    if (player && player.disc) {
                                        if (args[1] === "r" && !isNaN(parseInt(args[2]))) {
                                            let discId = null;
                                            this.getAllDiscs().forEach((d) => {
                                                if ((d as any).playerId === parseInt(args[0])) {
                                                    discId = this.getAllDiscs().indexOf(d);
                                                }
                                            });
                                            if (discId !== null) {
                                                this.room.setDiscProperties(discId, {
                                                    radius: parseInt(args[2]),
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "Modifica los discos.",
                    false,
                    2
                );
            }
        };
    }

    return new CustomDiscPlugin();
}
