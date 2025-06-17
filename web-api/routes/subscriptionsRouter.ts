import express from "express";
import { SubscriptionsService } from "../service/SubscriptionsService";
import { DbUserSubscription } from "../types";
import { UsersService } from "../service/UsersService";

const usersService = UsersService.getInstance();
const subscriptionsService = SubscriptionsService.getInstance();

/**
 * @deprecated Se usa desde el router de Users.
 */
export const subscriptionsRouter = express.Router();

subscriptionsRouter.get("/", async (req, res) => {
    try {
        res.send({
            subscriptions: await subscriptionsService.getAllSubscriptions(),
        });
    } catch (error) {
        console.error("Error al obtener las suscripciones:", error);
        res.status(500).send({ error: "Error al obtener las suscripciones" });
    }
});

subscriptionsRouter.post("/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { tier } = req.body;
    const startDate = new Date().toISOString();
    if (!userId || !tier) {
        res.status(400).send({ error: "Faltan datos de suscripción" });
        return;
    }
    try {
        await subscriptionsService.createSubscription(userId, tier, startDate);
        res.send({ success: true, user: await usersService.getUserById(userId) });
    } catch (error) {
        console.error("Error al crear la suscripción:", error);
        res.status(500).send({ error: "Error al crear la suscripción" });
    }
});

subscriptionsRouter.patch("/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const updateObj: Partial<DbUserSubscription> = {};
    const allowedFields: (keyof DbUserSubscription)[] = [
        "tier",
        "scoreAnimId",
        "scoreMessage",
        "assistMessage",
        "joinMessage",
        "emoji",
    ];
    for (const field of allowedFields) {
        if (field in req.body) {
            updateObj[field] = req.body[field];
        }
    }
    try {
        subscriptionsService.updateSubscription(userId, updateObj);
        res.send({ success: true, user: await usersService.getUserById(userId) });
    } catch (error) {
        console.error("Error al actualizar la suscripción:", error);
        res.status(500).send({ error: "Error al actualizar la suscripción" });
    }
});
