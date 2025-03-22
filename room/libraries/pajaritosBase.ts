import { MainReturnType, PHPlayer } from "../types/types";

export default function (API: MainReturnType) {
  class PajaritosBaseLib extends API.Library {
    constructor() {
      super("PajaritosBase", {
        version: "1.0.0",
        author: "lombi",
        description:
          "Proporciona funcionalidades básicas para los plugins de Pajaritos y versiones extendidas de los objetos de la API de Haxball.",
      });
    }

    get players() {
      const players: PHPlayer[] = this.room.players.map((p) => {
        const extendedPlayer: PHPlayer = {
          name: p.name,
          id: p.id,
          team: p.team,
          flag: p.flag,
          avatar: p.avatar,
          isAdmin: p.isAdmin,
          headlessAvatar: p.headlessAvatar,
          avatarNumber: p.avatarNumber,
          auth: p.auth,
          conn: p.conn,
          ping: p.ping,
          customClient: p.customClient,
          input: p.input,
          kickRateMaxTickCounter: p.kickRateMaxTickCounter,
          kickRateMinTickCounter: p.kickRateMinTickCounter,
          isKicking: p.isKicking,
          disc: p.disc,
          sync: p.sync,
          ext: p.ext,
          identity: p.identity,

          showAnnouncements: true,
          comba: {
            holdTicks: 0,
          },
        };
        return extendedPlayer;
      });
      console.log(players[0].name);
      return players;
    }
  }

  return new PajaritosBaseLib();
}
