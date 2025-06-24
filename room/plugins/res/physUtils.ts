import { Disc, MovableDisc } from "@shared/types/node-haxball";
import { MovementDirection } from "../../libraries/pajaritosBase";

export function calcDistance(disc1: Disc, disc2: Disc) {
    let dx = disc1.pos.x - disc2.pos.x;
    let dy = disc1.pos.y - disc2.pos.y;
    return Math.sqrt(dx * dx + dy * dy) - disc1.radius - disc2.radius;
}

export function calcMagnitude(x: number, y: number) {
    return Math.sqrt(x * x + y * y);
}

export function calcVelocityBasedGravity(
    velocity: number,
    ball: Disc,
    combaGravityMultiplier: number
) {
    return (
        Math.sign(ball.speed.y) * // dirección
        -0.075 * // valor base
        (velocity / 6) * // multiplicador por velocidad, un tiro normal suele ser 6
        combaGravityMultiplier // multiplicador constante
    );
}

/**
 * Calcula la dirección hacia la que se encuentra el disco `disc2` desde `disc1`
 */
export function calcBallDirection(disc1: Disc | MovableDisc, disc2: Disc | MovableDisc): number {
    const direction = {
        x: disc2.pos.x - disc1.pos.x,
        y: disc2.pos.y - disc1.pos.y,
    };
    return Math.atan2(direction.y, direction.x);
}

/**
 * Discretiza una dirección en 8 posibles direcciones.
 */
export function discretizeDirection(direction: number): MovementDirection {
    // Discretiza la dirección en 8 posibles direcciones
    const directionIndex = Math.round(direction / (Math.PI / 4)) + 8;
    switch (directionIndex % 8) {
        case 0: return MovementDirection.Right;
        case 1: return MovementDirection.DownRight;
        case 2: return MovementDirection.Down;
        case 3: return MovementDirection.DownLeft;
        case 4: return MovementDirection.Left;
        case 5: return MovementDirection.UpLeft;
        case 6: return MovementDirection.Up;
        case 7: return MovementDirection.UpRight;
        default: return MovementDirection.None; // No hay dirección válida
    }
}

export function getOppositeDirection(direction: MovementDirection): MovementDirection {
    switch (direction) {
        case MovementDirection.Up: return MovementDirection.Down;
        case MovementDirection.Down: return MovementDirection.Up;
        case MovementDirection.Left: return MovementDirection.Right;
        case MovementDirection.Right: return MovementDirection.Left;
        case MovementDirection.UpLeft: return MovementDirection.DownRight;
        case MovementDirection.DownRight: return MovementDirection.UpLeft;
        case MovementDirection.DownLeft: return MovementDirection.UpRight;
        case MovementDirection.UpRight: return MovementDirection.DownLeft;
        case MovementDirection.KickNone: return MovementDirection.KickNone; // No hay dirección opuesta
        case MovementDirection.KickUp: return MovementDirection.KickDown;
        case MovementDirection.KickDown: return MovementDirection.KickUp;
        case MovementDirection.KickLeft: return MovementDirection.KickRight;
        case MovementDirection.KickRight: return MovementDirection.KickLeft;
        case MovementDirection.KickUpLeft: return MovementDirection.KickDownRight;
        case MovementDirection.KickDownRight: return MovementDirection.KickUpLeft;
        case MovementDirection.KickDownLeft: return MovementDirection.KickUpRight;
        case MovementDirection.KickUpRight: return MovementDirection.KickDownLeft;
        default: return direction; // No hay dirección opuesta
    }
}

export function isKicking(direction: MovementDirection): boolean {
    return (
        direction === MovementDirection.KickNone ||
        direction === MovementDirection.KickUp ||
        direction === MovementDirection.KickDown ||
        direction === MovementDirection.KickLeft ||
        direction === MovementDirection.KickRight ||
        direction === MovementDirection.KickUpLeft ||
        direction === MovementDirection.KickDownRight ||
        direction === MovementDirection.KickDownLeft ||
        direction === MovementDirection.KickUpRight
    );
}

/**
 * Devuelve la dirección de movimiento sin considerar que sea una patada.
 */
export function getMovementDirectionWithoutKick(
    direction: MovementDirection
): MovementDirection {
    switch (direction) {
        case MovementDirection.KickNone: return MovementDirection.None;
        case MovementDirection.KickUp: return MovementDirection.Up;
        case MovementDirection.KickDown: return MovementDirection.Down;
        case MovementDirection.KickLeft: return MovementDirection.Left;
        case MovementDirection.KickRight: return MovementDirection.Right;
        case MovementDirection.KickUpLeft: return MovementDirection.UpLeft;
        case MovementDirection.KickDownRight: return MovementDirection.DownRight;
        case MovementDirection.KickDownLeft: return MovementDirection.DownLeft;
        case MovementDirection.KickUpRight: return MovementDirection.UpRight;
        default: return direction; // No es una dirección de patada, se devuelve tal cual
    }
}