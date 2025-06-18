import express from "express";
import { BansService } from "../service/BansService";
import { Ban } from "../entities/Ban";

const bansService = BansService.getInstance();

export const bansRouter = express.Router();

bansRouter.get("/", async (req, res) => {
    try {
        const isPermanent =
            req.query.isPermanent === "true"
                ? true
                : req.query.isPermanent === "false"
                ? false
                : undefined;
        const isActive =
            req.query.isActive === "true"
                ? true
                : req.query.isActive === "false"
                ? false
                : undefined;
        const toUserId = req.query.toUserId ? parseInt(req.query.toUserId as string) : undefined;
        const byUserId = req.query.byUserId ? parseInt(req.query.byUserId as string) : undefined;
        const bans = await bansService.getAllBans({ isPermanent, isActive, toUserId, byUserId });
        res.json({ bans });
    } catch (error) {
        console.error("Error al obtener los bans:", error);
        res.status(500).json({ error: "Error al obtener los bans" });
    }
});

bansRouter.post("/", async (req, res) => {
    var { toUserId, toUserName, byUserId, reason, days, ip, auth, isPermanent } = req.body;
    if (!days) days = 0;
    if (!reason) reason = "";

    if (!ip || !auth) {
        res.status(400).json({ error: "Faltan una ip o un auth de haxball a registrar" });
        return;
    }
    try {
        const ban = await bansService.createBan(
            toUserId || null,
            toUserName || null,
            byUserId || null,
            reason || null,
            new Date(),
            days || 0,
            ip || null,
            auth,
            !!isPermanent
        );
        res.json({ ban });
    } catch (error) {
        console.error("Error al crear el ban:", error);
        res.status(500).json({ error: "Error al crear el ban" });
    }
});

bansRouter.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const newData: Partial<Ban> = {
        isPermanent: req.body.isPermanent,
        isActive: req.body.isActive,
        reason: req.body.reason,
        days: req.body.days,
        ip: req.body.ip,
        auth: req.body.auth,
    };
    if (Object.keys(newData).length === 0) {
        res.status(400).json({ error: "No se proporcionaron datos para actualizar" });
        return;
    }
    try {
        const updatedBan = await bansService.updateBan(parseInt(id), newData);
        if (updatedBan) {
            res.json({ ban: updatedBan });
        } else {
            res.status(404).json({ error: "Ban no encontrado" });
        }
    } catch (error) {
        console.error("Error al actualizar el ban:", error);
        res.status(500).json({ error: "Error al actualizar el ban" });
    }
});
