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
  jwtSecret: string;
}

declare global {
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
