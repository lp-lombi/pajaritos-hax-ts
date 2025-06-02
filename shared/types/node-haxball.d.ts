import NodeHaxball from "room/node_modules/node-haxball";

export type MainReturnType = ReturnType<typeof NodeHaxball>;

export type Room = MainReturnType["Room"]["prototype"];
export type Player = Room["players"][0];
export type Team = Player["team"];
export type Disc = ReturnType<Room["getDisc"]>;
export type MovableDisc = NonNullable<Player["disc"]>;
export type Stadium = Room["stadium"];
export type Plugin = Room["plugins"][0];
export type Library = Room["libraries"][0];
export type Utils = MainReturnType["Utils"];

export type SetDiscPropertiesParams = Parameters<Room["setDiscProperties"]>[1];
export type OperationType = MainReturnType["OperationType"][keyof MainReturnType["OperationType"]];
export type HaxballEvent = MainReturnType["HaxballEvent"][keyof MainReturnType["HaxballEvent"]];
export type SendChatEvent = MainReturnType["SendChatEvent"][keyof MainReturnType["SendChatEvent"]];

export type GeoLocation = Awaited<ReturnType<Utils["getGeo"]>>;
export type CreateRoomParams = Parameters<MainReturnType["Room"]["create"]>[0];
export type CommonNetworkRoomParams = Parameters<MainReturnType["Room"]["create"]>[1];