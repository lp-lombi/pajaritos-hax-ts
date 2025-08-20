import PajaritosBaseLib from "./libraries/pajaritosBase";
import CommandsPlugin from "./plugins/commands";
import ChatbordPlugin from "./plugins/chatbord";
import MatchHistoryPlugin from "./plugins/matchHistory";
import GamemodesPlugin from "./plugins/gamemodes";
import { CreateRoomParams, GeoLocation, HaxballEvent } from "shared/types/node-haxball";

declare global {
    var roomVersion: string;
}

export type CreateRoomParamsOptionalGeo = Omit<CreateRoomParams, "geo"> & { geo?: GeoLocation };

export interface PajaritosRoomConfig {
    createParams: CreateRoomParamsOptionalGeo;
    botName?: string;
    webApi: WebApiData;
    discord: {
        whReplaysUrl: string;
    };
}
export interface WebApiData {
  url: string;
  key: string;
  user: {
    username: string;
    password: string;
  }
}
export interface CommandsPluginData {
  discord?: string;
  webApi: WebApiData;
}
export interface Command {
  prefix: string;
  name: string;
  exec: (msg: HaxballEvent, args: string[]) => void;
  desc: string;
  hidden: boolean;
  role: number;
  vipTier: number;
}
export type AnnouncementStyle =
  | "info"
  | "info-big"
  | "announcement"
  | "announcement-big"
  | "hint"
  | "error"
  | "warn"
  | "alert"
  | "red-stats"
  | "blue-stats"
  | "vip-message";

/** Jugador de Haxball con propiedades adicionales */
export type PHUser = {
  id: number | null;
  role: number;
  username: string;
  subscription?: {
    tier: number;
    startDate: string;
    scoreAnimId: number;
    scoreMessage: string;
    chatColor: number | null;
    joinMessage: string;
    emoji: string;
  };
  stats?: {
    score: number;
    assists: number;
    matches: number;
    wins: number;
    rating: number;
  };
};
export type PHExtraPlayerData = {
  showAds: boolean;
  mutedPlayersIds: number[];
  comba: {
    holdTicks: number;
  };
  user?: PHUser;
};

export interface PlayerModifier {
  playerId: number;
  discProperties: Object;
}

/**
 * Posibles entradas de dirección del jugador. Las combinaciones de estas entradas
 * dan como resultado enteros que representan cualquier posible dirección.
 */
export enum Input {
    None = 0,
    Up = 1,
    Down = 2,
    Left = 4,
    Right = 8,
    Kick = 16,
}

export const InputOpposites: Record<Input, Input> = {
    [Input.None]: Input.Kick,
    [Input.Up]: Input.Down,
    [Input.Down]: Input.Up,
    [Input.Left]: Input.Right,
    [Input.Right]: Input.Left,
    [Input.Kick]: Input.None
}

export type PajaritosBaseLib = ReturnType<typeof PajaritosBaseLib>;
export type PHPlayer = PajaritosBaseLib["players"][0];

export type CommandsPlugin = ReturnType<typeof CommandsPlugin>;
export type AuthPlugin = ReturnType<typeof CommandsPlugin>;
export type MatchHistoryPlugin = ReturnType<typeof MatchHistoryPlugin>;
export type WebApiClient = ReturnType<typeof CommandsPlugin>;
export type ChatbordPlugin = ReturnType<typeof ChatbordPlugin>;
export type GamemodesPlugin = ReturnType<typeof GamemodesPlugin>;
