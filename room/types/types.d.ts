import NodeHaxball from "node-haxball";
import PajaritosBaseLib from "../libraries/pajaritosBase";
import CommandsPlugin from "../plugins/commands";
import ChatbordPlugin from "../plugins/chatbord";

//
// Tipos de la API
//

export type MainReturnType = ReturnType<typeof NodeHaxball>;
declare const API: MainReturnType;

export type Room = typeof API.Room.prototype;
export type Player = ReturnType<typeof API.Room.prototype.getPlayer>;
export type Disc = ReturnType<typeof API.Room.prototype.getDisc>;
export type Plugin = (typeof API.Room.prototype.plugins)[0];
export type Library = (typeof API.Room.prototype.libraries)[0];
export type Utils = (typeof API.Utils)[keyof typeof API.Utils];

export type OperationType = MainReturnType["OperationType"][keyof MainReturnType["OperationType"]];
export type HaxballEvent = (typeof API.HaxballEvent)[keyof typeof API.HaxballEvent];
export type SendChatEvent = (typeof API.SendChatEvent)[keyof typeof API.SendChatEvent];

export type GeoLocation = Awaited<ReturnType<typeof API.Utils.getGeo>>;
export type CreateRoomParams = Parameters<typeof API.Room.create>[0];
export type CommonNetworkRoomParams = Parameters<typeof API.Room.create>[1];

//
// Tipos del servidor Pajaritos
//

export type CreateRoomParamsOptionalGeo = Omit<CreateRoomParams, "geo"> & { geo?: GeoLocation };

export interface PajaritosRoomConfig {
    createParams: CreateRoomParamsOptionalGeo;
    botName?: string;
}

export interface WebApiData {
    url: string;
    key: string;
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
export type AnnouncementStyle = "info" | "info-big" | "announcement" | "announcement-big" | "hint" | "error" | "warn" | "alert";

/** Jugador de Haxball con propiedades adicionales */
export type PHUser = {
    id: number;
    role: number;
    username: string;
    subscription?: {
        tier: number;
        startDate: string;
        scoreMessage: string;
        assistMessage: string;
        joinMessage: string;
        emoji: string;
    };
};
export type PHExtraPlayerData = {
    showAnnouncements: boolean;
    comba: {
        holdTicks: number;
    };
    user?: PHUser;
};
export type PHPlayer = Player & PHExtraPlayerData;

export type PajaritosBaseLib = ReturnType<typeof PajaritosBaseLib>;

export type CommandsPlugin = ReturnType<typeof CommandsPlugin>;
export type ChatbordPlugin = ReturnType<typeof ChatbordPlugin>;
