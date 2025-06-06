import express, { Request } from "express";
import { getDatabase } from "../db/database";
import { UsersService } from "../service/UsersService";
import { StatsService } from "../service/StatsService";
import { SeasonsService } from "../service/SeasonsService";
import Utils from "../utils/Utils";
import { SubscriptionsService } from "../service/SubscriptionsService";
import { DbUser, DbUserStats, DbUserSubscription } from "../types";

export const usersRouter = express.Router();

const database = getDatabase();
const usersService = new UsersService(database);
const seasonsService = new SeasonsService(database);
const statsService = new StatsService(database, seasonsService);
const subscriptionsService = new SubscriptionsService(database);

usersRouter.get("/", async (req, res) => {
    try {
        const filterWithStats = req.query.stats === "true";
        const users = await Utils.getAllUsersDto(filterWithStats);
        res.send({ users });
    } catch (error) {
        console.error("Error al obtener todos los usuarios:", error);
        res.status(500).send({ error: "Error al obtener todos los usuarios" });
    }
});

usersRouter.get("/:id", async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).send({ error: "ID de usuario inválido" });
        return;
    }
    try {
        const user = await Utils.getUserDtoByUserId(userId);
        if (!user) {
            res.status(404).send({ error: "Usuario no encontrado" });
            return;
        }
        res.send({ user });
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).send({ error: "Error al obtener el usuario" });
    }
});

usersRouter.patch("/:id", async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).send({ error: "ID de usuario inválido" });
    }
    const allowedFields: (keyof DbUser)[] = ["username", "password", "role", "discordId"];
    const updateObj: Partial<DbUser> = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updateObj[field] = field === "role" ? parseInt(req.body[field]) : req.body[field];
        }
    }
    if (Object.keys(updateObj).length === 0) {
        res.status(400).send({ error: "No se proporcionaron datos para actualizar" });
        return;
    }
    try {
        const updatedUser = await usersService.updateUserById(userId, updateObj);
        if (!updatedUser) {
            res.status(404).send({ error: "Usuario no encontrado" });
            return;
        }
        const userDto = await Utils.getUserDtoByUserId(updatedUser.id);
        if (!userDto) {
            res.status(500).send({ error: "No se pudo obtener la información del usuario" });
            return;
        }
        res.send({ user: userDto });
    } catch (error) {
        console.error("Error al actualizar el usuario:", error);
        res.status(500).send({ error: "Error al actualizar el usuario" });
    }
});

usersRouter.post("/:id/stats/sum", async (req, res) => {
    if (!req.params.id) {
        res.status(400).send({ error: "Faltan datos de usuario" });
        return;
    }
    const { score, assists, matches, wins } = req.body;
    if (!score && !assists && !matches && !wins) {
        res.status(400).send({ error: "Faltan las estadísticas a sumar" });
        return;
    }
    const updateObj: Partial<DbUserStats> = {};
    if (score) updateObj.score = score;
    if (assists) updateObj.assists = assists;
    if (matches) updateObj.matches = matches;
    if (wins) updateObj.wins = wins;
    const updatedUser = await statsService.sumStatsByUserId(parseInt(req.params.id), updateObj);
    if (!updatedUser) {
        res.status(404).send({ error: "Usuario no encontrado" });
        return;
    }
    res.send({ user: updatedUser });
});

usersRouter.get("/:id/subscription", async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).send({ error: "ID de usuario inválido" });
        return;
    }
    try {
        const userSubscription = await subscriptionsService.getSubscriptionByUserId(userId);
        res.send({ subscription: userSubscription });
    } catch (error) {
        console.error("Error al obtener la suscripción del usuario:", error);
        res.status(500).send({ error: "Error al obtener la suscripción del usuario" });
    }
});

usersRouter.post("/:id/subscription", async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).send({ error: "ID de usuario inválido" });
        return;
    }
    const { tier, startDate } = req.body;
    if (!tier || !startDate) {
        res.status(400).send({ error: "Faltan datos de suscripción" });
        return;
    }
    try {
        const newSubscription = await subscriptionsService.createSubscription(
            userId,
            tier,
            startDate
        );
        res.send({ subscription: newSubscription });
    } catch (error) {
        console.error("Error al crear la suscripción del usuario:", error);
        res.status(500).send({ error: "Error al crear la suscripción del usuario" });
    }
});

usersRouter.patch("/:id/subscription", async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).send({ error: "ID de usuario inválido" });
        return;
    }

    const allowedFields: (keyof DbUserSubscription)[] = [
        "tier",
        "startDate",
        "scoreMessage",
        "assistMessage",
        "joinMessage",
        "emoji",
        "scoreAnimId",
    ];

    const updateObj: Partial<DbUserSubscription> = {};

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updateObj[field] =
                field === "scoreAnimId" || field === "tier"
                    ? parseInt(req.body[field])
                    : req.body[field];
        }
    }

    if (Object.keys(updateObj).length === 0) {
        res.status(400).send({ error: "No se proporcionaron datos para actualizar" });
        return;
    }

    try {
        const updatedSubscription = await subscriptionsService.updateSubscription(
            userId,
            updateObj
        );
        if (!updatedSubscription) {
            res.status(404).send({ error: "Suscripción no encontrada" });
            return;
        }
        res.send({ subscription: updatedSubscription });
    } catch (error) {
        console.error("Error al actualizar la suscripción del usuario:", error);
        res.status(500).send({ error: "Error al actualizar la suscripción del usuario" });
    }
});
