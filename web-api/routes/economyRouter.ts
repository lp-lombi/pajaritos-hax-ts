import express from "express";
import { EconomyService } from "../service/EconomyService";
import { UsersService } from "../service/UsersService";
import { PHError } from "../utils/PHError";
import { ErrorResponseDto, TransactionResponseDto } from "@shared/types/dtos/misc.dto";

export const economyRouter = express.Router();

const economyService = EconomyService.getInstance();
const usersService = UsersService.getInstance();

economyRouter.post("/transaction", async (req, res) => {
    const { byUserId, toUserId, amount, type } = req.body;
    const toUser = await usersService.getUserById(toUserId);
    const byUser = byUserId ? await usersService.getUserById(byUserId) : null;
    if (!toUser) {
        res.status(404).send({ error: "Usuario destino no encontrado" });
        return;
    }
    try {
        if (type === "transfer" && !byUser) {
            const resBody: ErrorResponseDto = {
                error: "Usuario origen no encontrado",
            };
            res.status(404).send(resBody);
            return;
        }
        const transaction = await economyService.registerTransaction(
            toUserId,
            byUserId || null,
            amount,
            type
        );
        const resBody: TransactionResponseDto = {
            success: true,
            message: "Transacción realizada",
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date.toISOString(),
                toUserId: transaction.toUser.id,
                byUserId: transaction.byUser ? transaction.byUser.id : null,
            },
        };
        res.send(resBody);
    } catch (error) {
        if (error instanceof PHError) {
            const resBody: ErrorResponseDto = {
                error: error.message,
            };
            res.status(400).send(resBody);
            return;
        }
        console.error("Error al registrar la transacción:", error);
        const resBody: ErrorResponseDto = {
            error: "Error en la transacción",
        };
        res.status(500).send(resBody);
    }
});