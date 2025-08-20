import fs from "fs";
import path from "path";
import { CommandsPlugin, PajaritosBaseLib, PajaritosRoomConfig } from "room/types";
import { PajaritosRoomConfigFile as ServerConfigFile, RoomServerUser } from "./types";

const defaultConfigFile: ServerConfigFile = {
    createParams: {
        name: "Pajaritos Hax",
        password: "",
        maxPlayerCount: 10,
        showInRoomList: true,
        token: "",
    },
    botName: "Cristo",
    webApi: {
        url: "http://localhost:3000/api/v2",
        user: {
            username: "root",
            password: "root",
        },
    },
    discord: {
        whReplaysUrl: "",
    },
    jwtSecret: "pajaritos",
};

async function getApiKey(url: string, user: { username: string; password: string }) {
    try {
        const loginResponse = await fetch(`${url}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: user.username,
                password: user.password,
            }),
        });
        if (!loginResponse.ok) {
            throw new Error(
                `Error al iniciar sesión para obtener la clave API: ${loginResponse.statusText}`
            );
        }
        const loginData = await loginResponse.json();
        if (!loginData.token) {
            throw new Error("No se pudo iniciar sesión para obtener la clave API");
        }
        // TODO: verificar si se usa bearer
        const apiKeyResponse = await fetch(`${url}/auth/api-key`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${loginData.token}`,
            },
        });
        if (!apiKeyResponse.ok) {
            throw new Error(`Error al obtener la clave API: ${apiKeyResponse.statusText}`);
        }
        const apiKeyData = await apiKeyResponse.json();
        if (!apiKeyData.apiKey) {
            throw new Error("No se pudo obtener la clave API");
        }
        return apiKeyData.apiKey as string;
    } catch (error) {
        console.error("Error al obtener la clave API:", error);
        throw error;
    }
}

// TODO: eliminar y directamente meter la config en el global
function parseGlobal(roomConfig: PajaritosRoomConfig, jwtSecret: string) {
    global.roomConfig = roomConfig;
    global.webApi = roomConfig.webApi;
    global.jwtSecret = jwtSecret;
    global.geo = roomConfig.createParams.geo;
    global.room = null;
}

export function getCommandsPlugin () {
    if (global.room) {
        return global.room.plugins.find((p) => (p as any).name === "lmbCommands") as CommandsPlugin;
    }
    return null;
};
export function getPajaritosLib() {
    if (global.room) {
        return global.room.libraries.find(
            (l) => (l as any).name === "PajaritosBase"
        ) as PajaritosBaseLib;
    }
    return null;
}

export class Config {
    /**
     * Lee el archivo de configuración de la sala Pajaritos. También parsea
     * a global los datos requeridos para el servidor.
     */
    static async read() {
        const configPath = path.join(__dirname, "roomConfig.json");
        try {
            const fileExists = fs.existsSync(configPath);
            if (!fileExists) {
                console.log(
                    "El archivo de configuración no existe. Se creará uno por defecto en /server/roomConfig.json. Configurar y volver a iniciar el servidor."
                );
                Config.createNewConfigFile(configPath, defaultConfigFile);
                console.log(
                    `Se creó el archivo de configuración en ${configPath}.\n Configurarlo antes de iniciar el servidor.`
                );
                process.exit(1);
            }
            const data = fs.readFileSync(configPath, { encoding: "utf8" });
            const configFile = JSON.parse(data) as ServerConfigFile;
            const apiKey = await getApiKey(configFile.webApi.url, configFile.webApi.user);

            const roomConfig: PajaritosRoomConfig = {
                createParams: configFile.createParams,
                botName: configFile.botName,
                webApi: Object.assign({}, configFile.webApi, { key: apiKey }),
                discord: {
                    whReplaysUrl: configFile.discord?.whReplaysUrl || "",
                },
            };
            parseGlobal(roomConfig, configFile.jwtSecret);
            return roomConfig;
        } catch (err) {
            throw new Error(`No se pudo leer el archivo de configuración: ${err}`).message;
        }
    }

    static createNewConfigFile(configPath: string, configFile: ServerConfigFile) {
        fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2), { encoding: "utf8" });
    }
}
