import bcrypt from "bcrypt";

export class ApiKey {
    private static key: string | undefined = process.env.API_KEY;
    private constructor() {}
    static get() {
        if (!this.key) {
            throw new Error("API_KEY no ha sido inicializado. Llamar a ApiKey.generate() primero.");
        }
        return this.key;
    }
    static generateOne() {
        return bcrypt.hashSync(bcrypt.genSaltSync(10), 10);
    }
    static set(newKey: string) {
        this.key = newKey;
    }
}
