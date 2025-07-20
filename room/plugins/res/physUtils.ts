import { Disc, MovableDisc } from "@shared/types/node-haxball";
import { Input, InputOpposites } from "../../types";
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
export function discretizeDirection(direction: number): Input {
    // Discretiza la dirección en 8 posibles direcciones
    const directionIndex = Math.round(direction / (Math.PI / 4)) + 8;
    switch (directionIndex % 8) {
        case 0: return Input.Right;
        case 1: return Input.Down + Input.Right;
        case 2: return Input.Down;
        case 3: return Input.Down + Input.Left;
        case 4: return Input.Left;
        case 5: return Input.Up + Input.Left;
        case 6: return Input.Up;
        case 7: return Input.Up + Input.Right;
        default: return Input.None; // No hay dirección válida
    }
}

export function getPressedKeys(inputValue: number): Input[] {
    const pressed: Input[] = [];
    for (const key of [Input.Up, Input.Down, Input.Left, Input.Right, Input.Kick]) {
        if ((inputValue & key) !== 0) {
            pressed.push(key);
        }
    }
    return pressed;
}

export function getOppositeDirection(direction: Input): Input {
    return InputOpposites[direction] || Input.None;
}


/**
 * Devuelve la dirección de movimiento sin considerar que sea una patada.
 */
export function getDirectionOnly(direction: number) {
    return getPressedKeys(direction).reduce((acc, key) => {
        if (key !== Input.Kick) {
            acc |= key;
        }
        return acc;
    }, Input.None);
}