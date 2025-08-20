import type { WebApiData } from "room/types";
import type { GeoLocation, Room } from "shared/types/node-haxball";
import type { RequestHandler, Request, Response, NextFunction } from "express";
import type { CreateRoomParamsOptionalGeo } from "shared/types/room";

export interface RoomServerUser {
    username: string;
    id: string;
    role: string;
}

/**
 * Estrucutra del archivo de configuración de la sala de Pajaritos
 * El usuario y contraseña habilitados para la API web deben tener permisos de root
 */
// TODO: Renombrar y reestrucutrar ya que no solo es para room sino para server

// TODO: Me la re viví, debería ser un solo tipo con el archivo y listo
export interface PajaritosRoomConfigFile {
  createParams: CreateRoomParamsOptionalGeo;
  botName?: string;
  webApi: {
    url: string;
    user: {
      username: string;
      password: string;
    }
  };
  discord: {
    whReplaysUrl: string;
  }
  jwtSecret: string;
}

declare global {
    var roomConfig: PajaritosRoomConfig;
    var webApi: WebApiData;
    var geo: GeoLocation | undefined;
    var jwtSecret: string;
    var room: Room | null;
    var stadiumsPath: string;
    var verifyToken: RequestHandler;

    namespace Express {
        interface Request {
            user?: RoomServerUser;
        }
    }
}
