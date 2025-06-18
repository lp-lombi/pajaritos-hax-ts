import express from "express";
import { SeasonsService } from "../service/SeasonsService";

const seasonsService = SeasonsService.getInstance();

export const seasonsRouter = express.Router();

seasonsRouter.get("/", async (req, res) => {
    try {
        const seasons = await seasonsService.getAllSeasons();
        res.json({ seasons });
    } catch (error) {
        console.error("Error al obtener las temporadas:", error);
        res.status(500).json({ error: "Error al obtener las temporadas" });
    }
});

seasonsRouter.get("/current", async (req, res) => {
    try {
        const currentSeason = await seasonsService.getCurrentSeason();
        if (!currentSeason) {
            res.status(404).json({ error: "No hay temporada actual" });
            return;
        }
        res.json({ season: currentSeason });
    } catch (error) {
        console.error("Error al obtener la temporada actual:", error);
        res.status(500).json({ error: "Error al obtener la temporada actual" });
    }
});

seasonsRouter.get("/:id", async (req, res) => {
    const seasonId = parseInt(req.params.id, 10);
    if (isNaN(seasonId)) {
        res.status(400).json({ error: "ID de temporada inválido" });
        return;
    }
    try {
        const season = await seasonsService.getSeasonById(seasonId);
        if (!season) {
            res.status(404).json({ error: "Temporada no encontrada" });
            return;
        }
        res.json({ season });
    } catch (error) {
        console.error("Error al obtener la temporada:", error);
        res.status(500).json({ error: "Error al obtener la temporada" });
    }
});

seasonsRouter.post("/", async (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: "Nombre de temporada requerido" });
        return;
    }
    try {
        const newSeason = await seasonsService.createSeason(name);
        res.status(201).json({ season: newSeason });
    } catch (error) {
        console.error("Error al crear la temporada:", error);
        res.status(500).json({ error: "Error al crear la temporada" });
    }
});
