import { MainReturnType } from "@shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib } from "../types";

interface Kit {
    name: string;
    cfg: string; // "angle fontColor color1 [color2] [color3]"
}

export default function (API: MainReturnType) {
    class KitsPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        commands!: CommandsPlugin;

        constructor(private kits = Array<Kit>()) {
            super("lmbKits", true, {
                version: "0.1",
                author: "lombi",
                description: `Plugin de guardado y uso de casacas.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        fetchKits() {
            this.commands.database.all<Kit>("SELECT * FROM kits", (err, rows) => {
                if (err) {
                    console.error("Error fetching kits from database:", err);
                } else {
                    this.kits = rows;
                }
            });
        }

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.commands) {
                console.log("El plugin de casacas requiere del plugin de comandos.");
            } else {
                this.fetchKits();

                this.commands.registerCommand(
                    "!",
                    "casaca",
                    (msg, args) => {
                        if (args.length === 0) {
                            let kitsString = "Lista de camisetas: \n";
                            this.kits.forEach((k) => {
                                kitsString += "   " + k.name + "   -";
                            });
                            kitsString +=
                                "\n Uso: !casaca <equipo> <nombre> | ej ' !casaca red independiente '";
                            this.commands.chat.announce(kitsString, msg.byId);
                        } else if (args.length > 0) {
                            if (args[0] === "red" || args[0] === "blue") {
                                if (args.length === 2) {
                                    let k = this.kits.find((k) => k.name === args[1]);
                                    if (k) {
                                        let colorsList = k.cfg.split(/[ ]+/);
                                        let angle = parseInt(colorsList.splice(0, 1)[0]);

                                        let t =
                                            args[0] === "red" ? 1 : args[0] === "blue" ? 2 : null;

                                        t
                                            ? this.room.setTeamColors(
                                                  t,
                                                  angle,
                                                  ...colorsList.map((c) => parseInt(c, 16))
                                              )
                                            : this.commands.chat.announce(
                                                  "Equipo inválido.",
                                                  msg.byId,
                                                  "error"
                                              );
                                    } else {
                                        this.commands.chat.announce(
                                            "Camiseta no encontrada.",
                                            msg.byId
                                        );
                                    }
                                }
                            } else if (args[0] === "add") {
                                if (args.length >= 4) {
                                    let kitName = args[1];
                                    let angle = isNaN(parseInt(args[2])) ? null : parseInt(args[2]);
                                    let fontColor = args[3].length === 6 ? args[3] : null;
                                    let color1 = args[4]?.length === 6 ? args[4] : null;
                                    let color2 = args[5]?.length === 6 ? args[5] : null;
                                    let color3 = args[6]?.length === 6 ? args[6] : null;

                                    if (
                                        kitName !== null &&
                                        angle !== null &&
                                        fontColor !== null &&
                                        color1 !== null
                                    ) {
                                        let cfg = `${angle} ${fontColor} ${color1}`;
                                        if (color2) cfg += ` ${color2}`;
                                        if (color3) cfg += ` ${color3}`;

                                        let error = false;

                                        this.commands.database.run(
                                            `INSERT INTO kits (name, cfg) VALUES ("${kitName}", "${cfg}")`,
                                            (err) => {
                                                if (err) console.log(err);
                                            }
                                        );
                                        if (error) {
                                            this.commands.chat.announce(
                                                "No se pudo guardar la camiseta.",
                                                msg.byId,
                                                "error"
                                            );
                                        } else {
                                            this.fetchKits();
                                            this.commands.chat.announce(
                                                "Se guardó la camiseta correctamente.",
                                                msg.byId
                                            );
                                        }
                                        return;
                                    }
                                }
                                this.commands.chat.announce(
                                    "Uso incorrecto del comando. ej: ' !casaca add independiente 0 CF0C0C FF0505 CF0C05 '",
                                    msg.byId,
                                    "error"
                                );
                            }
                        }
                    },
                    `"Cambiar camisetas | para asignar: " !casaca <equipo> <nombre> " | para listar todas: " !casaca " | para agregar: " !casaca add <nombre> <cfg> "`,
                    false,
                    1
                );
            }
        };
    }

    return new KitsPlugin();
}
