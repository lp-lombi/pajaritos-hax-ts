import NodeHaxball from "node-haxball";
import { CreateRoomParams, Library, Room } from "shared/types/node-haxball";
import { PajaritosRoomConfig } from "shared/types/room";
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

const haxball = NodeHaxball();

/**
 * Crea una sala de Haxball y devuelve la referencia a ella cuando se obtiene el link
 */
export default async function HaxballRoom(roomConfig: PajaritosRoomConfig) {
    return new Promise<Room>(async (resolve, reject) => {
        try {
            if (!roomConfig.createParams.geo)
                roomConfig.createParams.geo = await haxball.Utils.getGeo();
            const commandsDb = await initDb();
            const commandsData = {
                discord: "https://discord.gg/Y5ZWvjftP6",
                webApi: {
                    //url: "http://38.180.185.171:3000",
                    url: "http://localhost:3000/api/v2",
                    key: "$2b$10$UclfE7qq5svmOj7KRdNmFevfcupJrvE4wm0HicZ92oMImfx0wyInK",
                },
            };
            haxball.Room.create(roomConfig.createParams as CreateRoomParams, {
                libraries: [PajaritosBase(haxball) as unknown as Library],
                plugins: [
                    Commands(haxball, commandsData, commandsDb),
                    Chatbord(haxball),
                    Comba(haxball),
                    Autobot(haxball),
                    Auth(haxball, commandsData.webApi),
                    Gamemodes(haxball),
                    SubsFeatures(haxball, commandsData.webApi),
                    MatchHistory(haxball, commandsData.webApi),
                ],
                onOpen: (room) => {
                    room.onRoomLink = () => {
                        resolve(room);
                    };
                },
                onClose(reason) {
                    if (reason.code === 38) reject("Token inválido o expirado");
                },
            });
        } catch (error) {
            reject(error);
        }
    });
}
