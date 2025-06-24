import {
    HaxballEvent,
    MainReturnType,
    OperationType,
    SendInputEvent,
} from "@shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib } from "../types";
import { MovementDirection } from "../libraries/pajaritosBase";
import {
    calcBallDirection,
    calcDistance as calcDiscsDistance,
    calcMagnitude,
    discretizeDirection,
    getMovementDirectionWithoutKick as getKickDirection,
    getOppositeDirection,
    isKicking,
} from "./res/physUtils";

export default function (API: MainReturnType) {
    class PisaditaPlugin extends API.Plugin {
        commands!: CommandsPlugin;
        phLib!: PajaritosBaseLib;
        active: boolean = true;
        minThreshold = 3;
        maxThreshold = 18;
        maxSpeed = 2.5;
        force = 2.5;
        preventKickPlayerIds: number[] = [];

        constructor() {
            super("lmbPisadita", true, {
                version: "1.0-ts",
                author: "lombi",
                description: `Permite hacer un toque hacia atrás`,
                allowFlags: API.AllowFlags.CreateRoom,
            });
        }

        override onOperationReceived = (type: OperationType, event: HaxballEvent) => {
            if (type === 3 && this.active) {
                const inputEvent = event as SendInputEvent;
                if (!isKicking(inputEvent.input)) {
                    this.preventKickPlayerIds = this.preventKickPlayerIds.filter(
                        (id) => id !== inputEvent.byId
                    );
                    return true;
                }
                const ball = this.room.getBall(true);
                const player = this.phLib.getPlayer(inputEvent.byId);
                if (!player || !player.disc || !ball) return true;
                if (this.preventKickPlayerIds.includes(player.id)) {
                    (event as SendInputEvent).input = getKickDirection(inputEvent.input);
                    return true;
                }
                const ballDirection = calcBallDirection(player.disc, ball);
                const discretizedBallDirection = discretizeDirection(ballDirection);
                const isMovingOppositeDir =
                    inputEvent.input !== MovementDirection.None &&
                    inputEvent.input !== MovementDirection.KickNone &&
                    getOppositeDirection(getKickDirection(inputEvent.input)) ===
                        discretizedBallDirection;
                if (!isMovingOppositeDir) return true;
                const distanceToBall = calcDiscsDistance(player.disc, ball);
                if (distanceToBall >= this.minThreshold && distanceToBall <= this.maxThreshold) {
                    const currentBallSpeed = ball.speed;

                    const xspeed = Math.cos(ballDirection) * this.force * -1;
                    const yspeed = Math.sin(ballDirection) * this.force * -1;

                    const ballUpdateObj = {
                        xspeed: currentBallSpeed.x + xspeed,
                        yspeed: currentBallSpeed.y + yspeed,
                    };
                    const targetVelocity = calcMagnitude(ballUpdateObj.xspeed, ballUpdateObj.yspeed);
                    if (targetVelocity > 3) {
                        const normalizedX = ballUpdateObj.xspeed / targetVelocity;
                        const normalizedY = ballUpdateObj.yspeed / targetVelocity;
                        ballUpdateObj.xspeed = normalizedX * this.maxSpeed;
                        ballUpdateObj.yspeed = normalizedY * this.maxSpeed;
                    }
                    this.room.setDiscProperties(0, ballUpdateObj);
                    this.preventKickPlayerIds.push(player.id);

                    // transforma el evento de entrada para que no se lo considere un kick
                    (event as SendInputEvent).input = getKickDirection(inputEvent.input);
                }
            }
            return true;
        };

        override initialize = () => {
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as PajaritosBaseLib;
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            if (!this.phLib || !this.commands) {
                throw new Error("No se encontró la librería PajaritosBase o el plugin Commands");
            }
            this.commands.registerCommand(
                "!",
                "pisadita",
                (msg, args) => {
                    if (args.length === 0) {
                        this.active = !this.active;
                        this.commands.chat.announce(
                            `Pisadita ${this.active ? "activada" : "desactivada"}`,
                            msg.byId
                        );
                    }
                },
                "Activa o desactiva la pisadita",
                true,
                2
            );
        };
    }
    return new PisaditaPlugin();
}
