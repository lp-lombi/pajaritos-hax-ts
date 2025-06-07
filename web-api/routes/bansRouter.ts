import express from "express";
import { getDatabase } from "../db/database";
import { BansService } from "../service/BansService";
import Utils from "../utils/Utils";
import { DbBan } from "../types";

const database = getDatabase();
const bansService = new BansService(database);

export const bansRouter = express.Router();

bansRouter.get("/", async (req, res) => {
    try {
        const isPermanent = req.query.isPermanent === "true";
        bansService.getAllBans().then(async (bans) => {
            const bannedUsers = await Promise.all(
                bans.map(async (ban) => {
                    const bannedUser = ban.toUserId
                        ? await Utils.getUserDtoByUserId(ban.toUserId)
                        : null;
                    const bannedByUser = ban.byUserId
                        ? await Utils.getUserDtoByUserId(ban.byUserId)
                        : null;
                    return Utils.createBanDto(ban, bannedUser, bannedByUser);
                })
            )
            const filteredBans = bannedUsers.filter(ban => ban.isPermanent === isPermanent);
            res.json({ bans: filteredBans });
        });
    } catch (error) {
        console.error("Error al obtener los bans:", error);
        res.status(500).json({ error: "Error al obtener los bans" });
    }
});

bansRouter.post("/", async (req, res) => {
    var { toUserId, toUserName, byUserId, reason, days, ip, auth, isPermanent } = req.body;
    const startDate = new Date().toISOString();
    if (!days) days = 0;
    if (!isPermanent) isPermanent = false;
    if (!reason) reason = "No especificado";

    if (!ip && !auth) {
        res.status(400).json({ error: "Faltan una ip o un auth de haxball a registrar" });
        return;
    }
    try {
        const ban = await bansService.createBan(
            toUserId || null,
            toUserName,
            byUserId,
            reason,
            startDate,
            days,
            ip,
            auth,
            isPermanent ? 1 : 0
        );
        res.json({ ban: Utils.createBanDto(ban) });
    } catch (error) {
        console.error("Error al crear el ban:", error);
        res.status(500).json({ error: "Error al crear el ban" });
    }
});

bansRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    const allowedFields: (keyof DbBan)[] = [
        "toUserId",
        "toUserName",
        "byUserId",
        "reason",
        "startDate",
        "days",
        "ip",
        "auth",
        "isPermanent",
        "isActive",
    ];
    const newData: Partial<DbBan> = {};

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            newData[field] =
                field === "isPermanent" || field === "isActive"
                    ? req.body[field]
                        ? 1
                        : 0
                    : req.body[field];
        }
    });

    try {
        const ban = await bansService.updateBan(parseInt(id), newData);
        if (!ban) {
            res.status(404).json({ error: "Ban no encontrado" });
            return;
        }
        res.json({ ban: Utils.createBanDto(ban) });
    } catch (error) {
        console.error("Error al actualizar el ban:", error);
        res.status(500).json({ error: "Error al actualizar el ban" });
    }
});
