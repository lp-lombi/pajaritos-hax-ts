import type { AnnouncementStyle, MainReturnType, PHPlayer, Player } from "../types/types";

export default function (API: MainReturnType) {
  class ChatbordPlugin extends API.Plugin {
    chatLog: { text: string; color: number; style: string }[] = [];
    #colors = {
      white: parseInt("D9D9D9", 16),
      beige: parseInt("EAD9AA", 16),
      pink: parseInt("EAB2AA", 16),
      red: parseInt("EA5F60", 16),
      green: parseInt("90F06A", 16),
      gray: parseInt("CCCBCB", 16),
      lime: parseInt("CCE9C1", 16),
      lightOrange: parseInt("FFC977", 16),
      orange: parseInt("FFB84C", 16),
      redTeam: parseInt("FFD9D9", 16),
      blueTeam: parseInt("DBD9FF", 16),
      vip: parseInt("FFDCB3", 16),
      redStats: parseInt("FF9999", 16),
      blueStats: parseInt("9999FF", 16),
    };

    constructor() {
      super("lmbChatbord", true, {
        version: "1.0-ts",
        author: "lombi",
        description: `Controlador de operaciones de E/S a través del chat. MAGA.`,
        allowFlags: API.AllowFlags.CreateRoom,
      });
    }

    /** Comunicación emitida directamente por un jugador */
    chat(msg: string, byId: number, targetId: number | null = null) {
      const player = this.room.getPlayer(byId) as PHPlayer | null;
      if (!player) return;
      const ballEmoji = player.team.id === 1 ? "🔴" : player.team.id === 2 ? "🔵" : "⚪";
      const teamColor =
        player.team.id === 1
          ? this.colors.redTeam
          : player.team.id === 2
          ? this.colors.blueTeam
          : this.colors.white;

      const str = `[${ballEmoji}] ${player.name}: ${msg}`;

      this.room.sendAnnouncement(str, targetId, teamColor, 1, 1);
    }

    // TODO: la firma del estilo está mal definido en la API, se fuerza el tipo
    /** Anuncio ya sea por el servidor o por consecuencia de la acción de un jugador */
    announce(
      msg: string,
      targetId: number | null = null,
      type: AnnouncementStyle = "info",
      sound: 0 | 1 | 2 = 1
    ) {
      var style: [number, number] = [this.colors.beige, "small-bold" as unknown as number];
      switch (type) {
        case "info-big":
          style = [this.colors.beige, "bold" as unknown as number];
          break;
        case "announcement":
          style = [this.colors.green, "small-bold" as unknown as number];
          break;
        case "announcement-big":
          style = [this.colors.green, "bold" as unknown as number];
          break;
        case "hint":
          style = [this.colors.gray, "small-bold" as unknown as number];
          break;
        case "error":
          style = [this.colors.pink, "small-bold" as unknown as number];
          break;
        case "warn":
          style = [this.colors.red, "bold" as unknown as number];
          break;
        case "alert":
          style = [this.colors.orange, "bold" as unknown as number];
          break;
      }
      this.room.sendAnnouncement(msg, targetId, ...style, sound);
    }

    logChat(text: string, color: number, style: string) {
      let maxLines = 50;
      this.chatLog.push({ text, color, style });
      maxLines > this.chatLog.length
        ? null
        : this.chatLog.splice(0, this.chatLog.length - maxLines);
    }

    get colors() {
      return this.#colors;
    }
  }

  return new ChatbordPlugin();
}
