import NodeHaxball from "node-haxball";
import { CreateRoomParams, PajaritosRoomConfig, Room } from "./types/types";
import { initDb } from "./plugins/res/commandsDb";
import Commands from "./plugins/commands";
import Chatbord from "./plugins/chatbord";
import Comba from "./plugins/comba";
import PajaritosBase from "./libraries/pajaritosBase";
const haxball = NodeHaxball();

/**
 * Crea una sala de Haxball y devuelve la referencia a ella cuando se obtiene el link
 */
export default async function HaxballRoom(roomConfig: PajaritosRoomConfig) {
  return new Promise<Room>(async (resolve, reject) => {
    try {
      if (!roomConfig.createParams.geo) roomConfig.createParams.geo = await haxball.Utils.getGeo();
      const commandsDb = await initDb();

      haxball.Room.create(roomConfig.createParams as CreateRoomParams, {
        libraries: [PajaritosBase(haxball)],
        plugins: [
          Commands(
            haxball,
            {
              discord: "https://discord.gg/Y5ZWvjftP6",
              webApi: {
                url: "",
                key: "",
              },
            },
            commandsDb
          ),
          Chatbord(haxball),
          Comba(haxball),
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
