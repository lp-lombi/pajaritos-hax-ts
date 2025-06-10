import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { getDatabase } from "../db/database";
import { UsersService } from "../service/UsersService";
import { StatsService } from "../service/StatsService";
import { SeasonsService } from "../service/SeasonsService";
import Utils from "../utils/Utils";
import { isRoot } from "../middleware/auth";
import { ApiKey } from "../utils/ApiKey";
import { LoginDto } from "@shared/types/webApiDTO";

export const authRouter = express.Router();

const database = getDatabase();
const usersService = new UsersService(database);
const seasonsService = new SeasonsService(database);
const statsService = new StatsService(database, seasonsService);

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
        const user = await usersService.getUserByUsername(username);
        if (!user) {
            res.status(401).send({ error: "Usuario o contraseña incorrectos" });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).send({ error: "Usuario o contraseña incorrectos" });
            return;
        }

        const userDto = await Utils.getUserDtoByUserId(user.id);
        if (!userDto) {
            res.status(500).send({ error: "No se pudo obtener la información del usuario" });
            return;
        }

        const secret = process.env.JWT_SECRET as jwt.Secret;
        const expiration = parseInt(process.env.JWT_EXPIRATION_HOURS as string);

        const token = jwt.sign(userDto, secret, { expiresIn: `${expiration}h` });

        usersService.updateUserById(user.id, {
            lastLoginDate: new Date().toISOString(),
        })
        res.send({ token, user: userDto } as LoginDto);
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
            res.status(409).send({ error: "El nombre de usuario ya está en uso" });
            return;
        }

        database.run("BEGIN TRANSACTION");
        const newUser = await usersService.createUser(username, password, 0);
        const newUserStats = await statsService.createUserStats(newUser.id);
        if (!newUser || !newUserStats) {
            database.run("ROLLBACK");
            res.status(500).send({ error: "Error al crear el usuario" });
            return;
        }
        database.run("COMMIT");
        const userDto = await Utils.getUserDtoByUserId(newUser.id);
        if (!userDto) {
            res.status(500).send({ error: "No se pudo obtener la información del usuario" });
            return;
        }

        const secret = process.env.JWT_SECRET as jwt.Secret;
        const expiration = parseInt(process.env.JWT_EXPIRATION_HOURS as string);
        const token = jwt.sign(userDto, secret, { expiresIn: `${expiration}h` });

        res.send({ token, user: userDto } as LoginDto);
    } catch (error) {
        database.run("ROLLBACK");
        console.error("Error al registrar el usuario:", error);
        res.status(500).send({ error: "Error al registrar el usuario" });
    }
});
