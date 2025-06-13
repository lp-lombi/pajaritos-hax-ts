import { MainReturnType, Player } from "@shared/types/node-haxball";
import { CommandsPlugin } from "../types";

interface Announcement {
    id: number;
    text: string;
}

export default function (API: MainReturnType) {
    class AnnouncementsPlugin extends API.Plugin {
        commands!: CommandsPlugin;
        constructor(
            public active = true,
            public isSaludoActive = true,
            public announcementsCycle = 3 * 60000, // 3 minutos por defecto
            public announcements = Array<Announcement>(),
            public saludo = ""
        ) {
            super("lmbAnnouncements", true, {
                version: "0.1",
                author: "lombi",
                description: `Plugin de anuncios en el chat.`,
                allowFlags: API.AllowFlags.CreateRoom,
            });

            /**@type {import("./types").CommandsPlugin} */
        }

        announcementLoop(i = 0) {
            setTimeout(() => {
                if (this.active) {
                    if (!this.announcements[i] && this.announcements[0]) {
                        i = 0;
                    } else if (!this.announcements[0]) {
                        this.announcementLoop();
                        return;
                    }

                    let an = this.announcements[i];
                    this.commands.phLib.players.forEach((player) => {
                        if (player.showAds) {
                            this.commands.chat.announce(`🕊️ ${an.text}`, player.id, "announcement");
                            this.commands.chat.announce(
                                `(!mute para silenciar estas alertas)`,
                                player.id,
                                "hint",
                                0
                            );
                        }
                    });
                }
                this.announcementLoop(i + 1);
            }, this.announcementsCycle);
        }

        setAnnouncementsCycleMinutes(minutes: number) {
            if (minutes < 0.25) return;
            this.announcementsCycle = minutes * 60000;
        }

        fetchAnnouncements() {
            let defaultAnnouncements = [
                { id: 1000, text: "Discord: " + this.commands.data.discord },
            ];
            this.announcements = defaultAnnouncements;

            this.commands.database.all<Announcement>("SELECT * FROM announcements", (err, rows) => {
                if (err) {
                    console.log(err);
                    return;
                }
                this.announcements.push(...rows);
            });
        }

        override onPlayerJoin = (playerObj: Player) => {
            setTimeout(() => {
                if (this.isSaludoActive) {
                    this.commands.chat.announce(this.saludo, playerObj.id, "announcement");
                }
            }, 500);
        };

        override initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.commands) {
                throw new Error("El plugin de anuncios requiere del plugin de comandos.");
            } else {
                this.saludo = `\n╔═══════════════════════════════════════════════════════╗
║   PAJARITOS HAX   ║ !discord !vip !stats !login !help !pm !bb  ║
╚═══════════════════════════════════════════════════════╝\n\n𝗕𝗜𝗘𝗡𝗩𝗘𝗡𝗜𝗗𝗢 𝗔 𝗟𝗔 𝗖𝗢𝗠𝗨𝗡𝗜𝗗𝗔𝗗 𝗗𝗘 𝗟𝗔 𝗖𝗢𝗠𝗕𝗔\n\n\n${this.commands.data.discord}`;
                this.fetchAnnouncements();
                this.announcementLoop();
                this.commands.registerCommand(
                    "!",
                    "mute",
                    (msg, args) => {
                        const player = this.commands.phLib.getPlayer(msg.byId);
                        if (player) {
                            if (player.showAds) {
                                player.showAds = false;
                                this.commands.chat.announce("Avisos desactivados", player.id);
                            } else {
                                player.showAds = true;
                                this.commands.chat.announce("Avisos activados", player.id);
                            }
                        }
                    },
                    "Desactiva los anuncios",
                    true,
                    0
                );
                this.commands.registerCommand(
                    "!",
                    "anuncios",
                    (msg, args) => {
                        if (args.length === 0) {
                            this.commands.chat.announce(
                                " !anuncios on / off | !anuncios ciclo <minutos> | !anuncios nuevo <texto del nuevo anuncio> | !anuncios borrar",
                                msg.byId
                            );
                        } else {
                            if (args[0] === "on") {
                                this.active = true;
                                this.commands.chat.announce("Avisos activados", msg.byId);
                            } else if (args[0] === "off") {
                                this.active = false;
                                this.commands.chat.announce("Avisos desactivados", msg.byId);
                            } else if (args[0] === "ciclo" && args[1]) {
                                const mins = parseFloat(args[1]);
                                if (!isNaN(mins)) {
                                    this.setAnnouncementsCycleMinutes(mins);
                                    this.commands.chat.announce(
                                        `Ciclo de anuncios cambiado a ${mins} minutos`,
                                        msg.byId
                                    );
                                    return;
                                }
                                this.commands.chat.announce(
                                    `Uso: !anuncios ciclo <minutos>`,
                                    msg.byId
                                );
                            } else if (args[0] === "nuevo") {
                                if (args[1]) {
                                    let newAnnouncement = args
                                        .slice(1)
                                        .join(" ")
                                        .replace(/"/g, '\\"');
                                    this.commands.database.run(
                                        `INSERT INTO announcements (text) VALUES ("${newAnnouncement}")`,
                                        (err) => {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            } else {
                                                this.fetchAnnouncements();
                                                this.commands.chat.announce(
                                                    `Nuevo anuncio creado: ${newAnnouncement}`,
                                                    msg.byId
                                                );
                                            }
                                        }
                                    );
                                } else {
                                    this.commands.chat.announce(
                                        "Uso: !anuncios nuevo <texto del nuevo anuncio> ",
                                        msg.byId
                                    );
                                }
                            } else if (args[0] === "borrar") {
                                if (!args[1]) {
                                    let str = "";
                                    this.announcements.forEach((a) => {
                                        if (a.id) {
                                            let txt =
                                                a.text.length < 75
                                                    ? a.text
                                                    : a.text.slice(0, 75) + "...";
                                            str += `[${a.id}] ${txt}\n`;
                                        }
                                    });
                                    str += "\n' !anuncios borrar <numero> ' para borrarlo.";
                                    this.commands.chat.announce(str, msg.byId);
                                } else if (!isNaN(parseInt(args[1]))) {
                                    const id = parseInt(args[1]);
                                    this.commands.database.run(
                                        `DELETE FROM announcements WHERE id=${id}`,
                                        (err) => {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            } else {
                                                this.fetchAnnouncements();
                                                this.commands.chat.announce(
                                                    `Anuncio ${id} borrado`,
                                                    msg.byId
                                                );
                                            }
                                        }
                                    );
                                }
                            } else if (args[0] === "fetch") {
                                this.fetchAnnouncements();
                                this.commands.chat.announce(
                                    `Se actualizaron los anuncios de la sala.`,
                                    msg.byId
                                );
                            }
                        }
                    },
                    "Ajustes de los anuncios. !anuncios on / off | !anuncios ciclo <minutos> | !anuncios nuevo <texto del nuevo anuncio> | !anuncios borrar | !anuncios fetch",
                    false,
                    2
                );
            }
        };
    }

    return new AnnouncementsPlugin();
}
