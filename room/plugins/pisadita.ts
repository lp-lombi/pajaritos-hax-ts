import { HaxballEvent, MainReturnType, OperationType, SendInputEvent } from "@shared/types/node-haxball";
import { PajaritosBaseLib } from "../types";
import { MovementDirection } from "../libraries/pajaritosBase";
import { calcBallDirection, calcDistance as calcDiscsDistance, discretizeDirection, getMovementDirectionWithoutKick as getKickDirection, getOppositeDirection, isKicking } from "./res/physUtils";

export default function (API: MainReturnType) {
    class PisaditaPlugin extends API.Plugin {
        phLib!: PajaritosBaseLib;
        minThreshold = 4;
        maxThreshold = 15;
        force = 1;

        constructor() {
            super("lmbPisadita", true, {
                version: "1.0-ts",
                author: "lombi",
                description: `Permite hacer un toque hacia atrás`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        override onOperationReceived = (type: OperationType, event: HaxballEvent) => {
            if (type === 3) {
                console.log("\nEvento de entrada recibido:", event);
                const inputEvent = event as SendInputEvent;
                if (!isKicking(inputEvent.input)) return true;
                const ball = this.room.getBall();
                if (!ball) return true;
                const player = this.phLib.getPlayer(inputEvent.byId);
                if (!player || !player.disc) return true;
                const ballDirection = calcBallDirection(player.disc, ball);
                const discretizedBallDirection = discretizeDirection(ballDirection);
                console.log(
                    `Dirección de la pelota desde ${player.name}: ${MovementDirection[discretizedBallDirection]}`
                );
                const isMovingOppositeDir =
                    inputEvent.input !== MovementDirection.None &&
                    inputEvent.input !== MovementDirection.KickNone &&
                    getOppositeDirection(getKickDirection(inputEvent.input)) === discretizedBallDirection;
                if (!isMovingOppositeDir) return true;
                console.log("El jugador está moviéndose en dirección opuesta a la pelota");
                const distanceToBall = calcDiscsDistance(player.disc, ball);
                console.log(
                    `Distancia a la pelota: ${distanceToBall.toFixed(2)} unidades`)
                if (
                    distanceToBall >= this.minThreshold &&
                    distanceToBall <= this.maxThreshold
                ) {
                    console.log("Pisadita activada");
                    const playerDiscId = this.room.getDiscs().indexOf(player.disc);

                    API.Utils.runAfterGameTick(() => {
                        const xspeed = Math.cos(ballDirection) * this.force * -1;
                        const yspeed = Math.sin(ballDirection) * this.force * -1;

                        const updateObj = {
                            xspeed,
                            yspeed,
                        }


                        console.log(
                            `Aplicando velocidad a la pelota: xspeed=${xspeed.toFixed(2)}, yspeed=${yspeed.toFixed(2)}`)
                        this.room.setDiscProperties(0, updateObj);
                        this.room.setDiscProperties(playerDiscId, updateObj);
                    }, 1);
                }
            }
            return true;
        };

        override initialize = () => {
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            if (!this.phLib) {
                throw new Error("No se encontró la librería PajaritosBase");
            }
        };
    }
    return new PisaditaPlugin();
}
