import HaxballRoom from "room";
import fs from "fs";
import path from "path";
import { CreateRoomParamsOptionalGeo, PajaritosRoomConfig } from "shared/types/room";

function readConfig() {
  const configPath = path.join(__dirname, "roomConfig.json");
  try {
    const fileExists = fs.existsSync(configPath);
    if (!fileExists) {
      console.log(
        "El archivo de configuración no existe. Se creará uno por defecto en /server/roomConfig.json. Configurar y volver a iniciar el servidor."
      );
      const createParams: CreateRoomParamsOptionalGeo = {
        name: "Pajaritos Hax",
        password: "",
        maxPlayerCount: 10,
        showInRoomList: true,
        token: "",
      };
      const config: PajaritosRoomConfig = { createParams, botName: "Cristo" };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: "utf8" });
      return config;
    }
    const data = fs.readFileSync(configPath, { encoding: "utf8" });
    const config = JSON.parse(data) as PajaritosRoomConfig;
    return config;
  } catch (err) {
    throw new Error(`No se pudo leer el archivo de configuración: ${err}`).message;
  }
}

async function init() {
  console.log("Iniciando servidor Pajaritos\n");
  try {
    const room = await HaxballRoom(readConfig());
    console.log(`-- Sala creada con éxito --\n- Link: ${room.link}`);
  } catch (error) {
    console.error("Error al crear la sala: " + error);
  }
}

init();
