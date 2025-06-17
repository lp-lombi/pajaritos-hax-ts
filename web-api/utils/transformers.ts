import { ValueTransformer } from "typeorm";

export const dateTransformer: ValueTransformer = {
    to(value: Date): string {
        return value.toISOString();
    },
    from(value: string): Date {
        return new Date(value);
    },
}

export const nullableDateTransformer: ValueTransformer = {
    to(value: Date | null): string | null {
        return value ? value.toISOString() : null;
    },
    from(value: string | null): Date | null {
        return value ? new Date(value) : null;
    },
}

export const booleanToNumberTransformer: ValueTransformer = {
    to(value: boolean): number {
        return value ? 1 : 0;
    },
    from(value: number): boolean {
        return value === 1;
    },
};