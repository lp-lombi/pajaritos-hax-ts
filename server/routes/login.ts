import { LoginDto } from "shared/types/dtos/webApiDTO";
import { Router, Request, Response } from "express";
const login = Router();
import { sign } from "jsonwebtoken";

login.post("/", async (req: Request, res: Response) => {
    try {
        const response = await fetch(global.webApi.url + "/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: req.body.username,
                password: req.body.password,
            }),
        });

        if (response.ok) {
            const data: LoginDto = await response.json();
            if (data.user.role > 0) {
                const token = sign(data, global.jwtSecret, {
                    expiresIn: "2h",
                });
                res.json({ token, userData: data.user });
            } else {
                res.send(data);
            }
        } else {
            res.status(401).send({
                message: "No se pudo iniciar la sesión",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({
            message: "Error al iniciar la sesión",
        });
    }
});

export default login;
