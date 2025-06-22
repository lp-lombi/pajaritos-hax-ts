import { MainReturnType } from "shared/types/node-haxball";
import { CommandsPlugin, PajaritosBaseLib, PHPlayer } from "../types";
import chroma from "chroma-js";
import { calcDistance, calcVelocity, calcVelocityBasedGravity } from "./res/physUtils";

export default function (API: MainReturnType) {
    const { AllowFlags, Utils, Plugin } = API;

    class CombaPlugin extends Plugin {
        commands!: CommandsPlugin;
        phLib!: PajaritosBaseLib;

        combaActive = true;
        combaCasting = false;
        combaShooting = false;
        isAnyPlayerInHoldingBall = false;
        holdDistance = 10;
        minHoldTicks = 40;
        combaShotTicks = 100;
        combaStrengthMultiplier = 1.75;
        combaGravityMultiplier = 0.7;
        castStrengthMultiplier = 0;
        combaGravityDecelerationFactor = 0.9875;
        combaGravityCollisionDecelerationFactor = 0.35;
        defaultStadiumKickStrength = 5;

        combaColor = parseInt("ff0000", 16);
        chromaCombaColor = chroma(this.combaColor.toString(16));
        chromaBallColor = chroma("FFFFFF");

        constructor() {
            super("lmbComba", true, {
                version: "1.0-ts",
                author: "lombi",
                description: `Plugin de comba y powershot, inspirado en el plugin powershot de ABC`,
                allowFlags: AllowFlags.CreateRoom,
            });
        }

        getValue(string: string) {
            const regex = /((?:\d+\.\d*)|(?:\d*\.?\d+))/g;
            const match = string.match(regex);
            if (!match) return 0;
            return parseFloat(match.join(""));
        }

        castComba() {
            if (this.castStrengthMultiplier < 1) {
                if (this.room) {
                    let castingPlayer: PHPlayer | null = null;
                    this.phLib.players.forEach((pObj) => {
                        const p = pObj;
                        if (p.comba?.holdTicks) {
                            if (
                                !castingPlayer ||
                                (castingPlayer.comba &&
                                    p.comba.holdTicks > castingPlayer.comba.holdTicks)
                            )
                                castingPlayer = p;
                        }
                    });
                    if (castingPlayer) {
                        this.castStrengthMultiplier += 0.02;
                    }
                }
            }
        }

        disableComba() {
            if (this.room) {
                this.castStrengthMultiplier = 0;
            }
        }

        combaShot(player: PHPlayer, ball: any) {
            Utils.runAfterGameTick(() => {
                let obj: { xspeed?: number; yspeed?: number; ygravity?: number } = {};
                let targetXSpeed =
                    ball.speed.x * this.combaStrengthMultiplier * this.castStrengthMultiplier;
                let targetYSpeed =
                    ball.speed.y * this.combaStrengthMultiplier * this.castStrengthMultiplier;

                let targetVelocity = calcVelocity(targetXSpeed, targetYSpeed);
                let currentVelocity = calcVelocity(ball.speed.x, ball.speed.y);
                let finalVelocity = currentVelocity;

                if (targetVelocity > currentVelocity) {
                    finalVelocity = targetVelocity;
                    obj.xspeed = targetXSpeed;
                    obj.yspeed = targetYSpeed;
                }
                obj.ygravity = calcVelocityBasedGravity(
                    finalVelocity,
                    ball,
                    this.combaGravityMultiplier
                );

                this.room.setDiscProperties(0, obj);

                this.combaShooting = true;
                if (player.comba) {
                    player.comba.holdTicks = 0;
                }
            }, 1);
        }

        decelerateGravity(discId: number, factor: number) {
            const ball = this.room?.gameState?.physicsState?.discs[0];
            if (ball) {
                Utils.runAfterGameTick(() => {
                    this.room.setDiscProperties(discId, {
                        ygravity: ball.gravity.y * factor,
                    });
                }, 1);
            }
        }

        override onGameTick = () => {
            if (this.combaActive) {
                let ball = this.room.gameState?.physicsState?.discs[0];
                if (!ball) return;
                this.isAnyPlayerInHoldingBall = false;
                this.phLib.players.forEach((p) => {
                    if (p && p.disc) {
                        if (calcDistance(p.disc, ball) < this.holdDistance) {
                            p.comba.holdTicks++;
                        } else {
                            p.comba.holdTicks = 0;
                        }
                        if (p.comba.holdTicks >= this.minHoldTicks) {
                            this.isAnyPlayerInHoldingBall = true;
                        }
                    }
                });

                if (this.isAnyPlayerInHoldingBall) {
                    this.castComba();
                } else if (!this.combaShooting) {
                    this.disableComba();
                }

                Utils.runAfterGameTick(() => {
                    let newGravity = ball.gravity.y * this.combaGravityDecelerationFactor;
                    let velocityBasedGravity = calcVelocityBasedGravity(
                        calcVelocity(ball.speed.x, ball.speed.y),
                        ball,
                        this.combaGravityMultiplier
                    );

                    // siempre debe tender a descender la gravedad
                    if (Math.abs(newGravity) > Math.abs(velocityBasedGravity)) {
                        newGravity = velocityBasedGravity;
                    }

                    // el color depende de si se está casteando o si se está tirando
                    let newColor = parseInt(
                        chroma
                            .mix(
                                this.chromaBallColor,
                                this.chromaCombaColor,
                                Math.abs(
                                    this.isAnyPlayerInHoldingBall
                                        ? this.castStrengthMultiplier * 0.08
                                        : newGravity
                                ) / 0.08
                            )
                            .hex()
                            .substring(1),
                        16
                    );

                    this.room.setDiscProperties(0, {
                        ygravity: Math.abs(ball.gravity.y) > 0.01 ? newGravity : 0,
                        color: newColor,
                    });

                    if (newGravity === 0) {
                        this.combaShooting = false;
                    }
                }, 1);
            }
        };

        override onPlayerBallKick = (playerId: number) => {
            if (this.combaActive) {
                const player = this.phLib.players.find((p) => p.id === playerId);
                const ball = this.room.getBall();
                if (player && ball && player.comba.holdTicks >= this.minHoldTicks) {
                    this.combaShot(player, ball);
                }
            }
        };

        override onCollisionDiscVsPlane = (discId: number) => {
            if (this.combaActive && discId === 0) {
                this.decelerateGravity(discId, this.combaGravityCollisionDecelerationFactor);
            }
        };

        override onCollisionDiscVsSegment = (discId: number) => {
            if (this.combaActive && discId === 0) {
                this.decelerateGravity(discId, this.combaGravityCollisionDecelerationFactor);
            }
        };

        override onCollisionDiscVsDisc = (
            discId1: number,
            discPlayerId1: number,
            discId2: number,
            discPlayerId2: number
        ) => {
            if (this.combaActive && (discId1 === 0 || discId2 === 0)) {
                this.decelerateGravity(
                    discId1 === 0 ? discId1 : discId2,
                    this.combaGravityCollisionDecelerationFactor
                );
            }
        };

        override onGameStart = (byId: number) => {
            if (this.room) {
                let ball = this.room.gameState?.physicsState?.discs[0];
                if (ball) {
                    this.chromaBallColor = chroma(ball.color.toString(16));
                }
                this.defaultStadiumKickStrength = this.room.stadium.playerPhysics.kickStrength;
            }
        };

        initialize = () => {
            this.commands = this.room.plugins.find(
                (p) => (p as any).name === "lmbCommands"
            ) as CommandsPlugin;
            this.phLib = this.room.libraries.find(
                (l) => (l as any).name === "PajaritosBase"
            ) as unknown as PajaritosBaseLib;
            if (!this.commands || !this.phLib) {
                throw new Error("comba: No se encontró el plugin lmbCommands o lmbPajaritosBase");
            } else {
                this.commands.registerCommand(
                    "!",
                    "comba",
                    (msg, args) => {
                        if (args[0] && args[0] === "lock") {
                            this.combaActive = !this.combaActive;
                            return;
                        }
                        if (this.combaActive) {
                            if (args[0] === "c") {
                                let v = this.getValue(args[1]);
                                if (!isNaN(v)) {
                                    this.combaGravityMultiplier = v;
                                    this.commands?.chat.announce(
                                        "Cambiando la comba a " + v,
                                        msg.byId
                                    );
                                }
                            } else if (args[0] === "f") {
                                let v = this.getValue(args[1]);
                                if (!isNaN(v)) {
                                    this.combaStrengthMultiplier = v;
                                    this.commands?.chat.announce(
                                        "Cambiando la fuerza a " + v,
                                        msg.byId
                                    );
                                }
                            } else if (args[0] === "preset") {
                                switch (args[1]) {
                                    case "1":
                                        this.combaStrengthMultiplier = 1.25;
                                        this.combaGravityMultiplier = 0.7;
                                        this.commands?.chat.announce(
                                            "Fuerza: " +
                                                this.combaStrengthMultiplier +
                                                " | Comba: " +
                                                this.combaGravityMultiplier,
                                            msg.byId
                                        );
                                        break;
                                    case "2":
                                        this.combaStrengthMultiplier = 1.75;
                                        this.combaGravityMultiplier = 0.7;
                                        this.commands?.chat.announce(
                                            "Fuerza: " +
                                                this.combaStrengthMultiplier +
                                                " | Comba: " +
                                                this.combaGravityMultiplier,
                                            msg.byId
                                        );
                                        break;
                                    case "3":
                                        this.combaStrengthMultiplier = 2;
                                        this.combaGravityMultiplier = 0.7;
                                        this.commands?.chat.announce(
                                            "Fuerza: " +
                                                this.combaStrengthMultiplier +
                                                " | Comba: " +
                                                this.combaGravityMultiplier,
                                            msg.byId
                                        );
                                        break;
                                    case "4":
                                        this.combaStrengthMultiplier = 2.5;
                                        this.combaGravityMultiplier = 0.7;
                                        this.commands?.chat.announce(
                                            "Fuerza: " +
                                                this.combaStrengthMultiplier +
                                                " | Comba: " +
                                                this.combaGravityMultiplier,
                                            msg.byId
                                        );
                                        break;
                                }
                            }
                        }
                    },
                    "Configuración de la comba. ' !comba f <valor> ' cambia la fuerza | ' !comba c <valor> cambia la comba ' | ' !comba preset <valor> ' cambia el preset.",
                    false,
                    2
                );
            }
        };
    }

    return new CombaPlugin();
}
