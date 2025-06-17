import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { UsersService } from "../service/UsersService";
import { isRoot } from "../middleware/auth";
import { ApiKey } from "../utils/ApiKey";
import { LoginResponseDto } from "@shared/types/dtos/misc.dto";
import { AppDataSource } from "../db/data-source";
import { User } from "../entities/User";

export const authRouter = express.Router();

const usersRepository = AppDataSource.getRepository(User);
const usersService = UsersService.getInstance();

authRouter.get("/api-key", isRoot, (req, res) => {
    res.send({ apiKey: ApiKey.get() });
});

authRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send({ error: "Faltan datos de inicio de sesión" });
        return;
    }
    try {
        const user = await usersRepository.findOneBy({ username });
        if (user) {
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if (isPasswordValid) {
                const userDto = await usersService.getUserById(user.id);
                if (!userDto) {
                    res.status(500).send({
                        error: "No se pudo obtener la información del usuario",
                    });
                    return;
                }

                const secret = process.env.JWT_SECRET as jwt.Secret;
                const expiration = parseInt(process.env.JWT_EXPIRATION_HOURS as string);

                const token = jwt.sign(userDto, secret, { expiresIn: `${expiration}h` });

                usersService.updateUserById(user.id, {
                    lastLoginDate: new Date().toISOString(),
                });
                res.send({ token, user: userDto } as LoginResponseDto);
                return;
            }
        }
        res.status(401).send({ error: "Usuario o contraseña incorrectos" });
        return;
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).send({ error: "Error al iniciar sesión" });
    }
});

authRouter.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send({ error: "Faltan datos de registro" });
        return;
    }
    try {
        const existingUser = await usersService.getUserByUsername(username);
        if (existingUser) {
            res.status(400).send({ error: "El nombre de usuario ya está en uso" });
            return;
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await usersService.createUser(username, hashedPassword, 0);

        const secret = process.env.JWT_SECRET as jwt.Secret;
        const expiration = parseInt(process.env.JWT_EXPIRATION_HOURS as string);

        const token = jwt.sign(newUser, secret, { expiresIn: `${expiration}h` });

        res.status(201).send({ token, user: newUser } as LoginResponseDto);
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).send({ error: "Error al registrar el usuario" });
    }
});
