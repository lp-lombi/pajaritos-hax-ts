
// TODO: Todos los errores deberian ser de esta clase
export class PHError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PHError";
    }
}