import NodeHaxball from "node-haxball";
import { CreateRoomParams, Library, Room } from "@shared/types/node-haxball";
import { PajaritosRoomConfig } from "./types";
import { initDb } from "./plugins/res/commandsDb";
import Commands from "./plugins/commands";
import Chatbord from "./plugins/chatbord";
import Comba from "./plugins/comba";
import Autobot from "./plugins/autobot";
import PajaritosBase from "./libraries/pajaritosBase";
import Auth from "./plugins/auth";
import SubsFeatures from "./plugins/subsFeatures";
import MatchHistory from "./plugins/matchHistory";
import Gamemodes from "./plugins/gamemodes";
import AdminFeatures from "./plugins/adminFeatures";
import Votes from "./plugins/vote";
import Kits from "./plugins/kits";
import Orbs from "./plugins/orbs";
import Announcements from "./plugins/announcements";
import CustomDisc from "./plugins/customDisc";

const haxball = NodeHaxball();

/**
 * Crea una sala de Haxball y devuelve la referencia a ella cuando se obtiene el link
 */
export default async function HaxballRoom(roomConfig: PajaritosRoomConfig) {
    return new Promise<Room>(async (resolve, reject) => {
        try {
            if (!roomConfig.createParams.geo) {
                console.log("Obteniendo geolocalización...");
                roomConfig.createParams.geo = await haxball.Utils.getGeo();
            }
            const commandsDb = await initDb();
            const commandsData = {
                discord: "https://discord.gg/Y5ZWvjftP6",
                webApi: roomConfig.webApi,
            };
            console.log(roomConfig.createParams)
            haxball.Room.create(roomConfig.createParams as CreateRoomParams, {
                libraries: [PajaritosBase(haxball) as unknown as Library],
                plugins: [
                    Commands(haxball, commandsData, commandsDb),
                    Auth(haxball, commandsData.webApi),
                    Chatbord(haxball),
                    Comba(haxball),
                    Autobot(haxball),
                    Gamemodes(haxball),
                    AdminFeatures(haxball),
                    SubsFeatures(haxball, commandsData.webApi),
                    MatchHistory(haxball, commandsData.webApi),
                    Votes(haxball),
                    Kits(haxball),
                    Orbs(haxball),
                    Announcements(haxball),
                    CustomDisc(haxball),
                ],
                storage: {
                    player_name: roomConfig.botName || "Pajarito",
                } as any,
                onOpen: (room) => {
                    room.onRoomLink = () => {
                        resolve(room);
                    };
                },
                onClose(reason) {
                    if (reason?.code === 38) reject("Token inválido o expirado");
                },
            });
        } catch (error) {
            reject(error);
        }
    });
}
