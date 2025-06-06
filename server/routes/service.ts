import { Router, Request, Response } from "express";



const service = Router();

service.get("/bans/perma/all", async (req: Request, res: Response) => {
    try {
        const response = await fetch(global.webApi.url + "/bans?isPermanent=true", {
            method: "GET",
            headers: { "x-api-key": global.webApi.key },
        });
        if (!response.ok) {
            throw new Error("Error al obtener permabans");
        }
        const bans = await response.json();
        res.send(bans);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error al obtener permabans");
    }
});

service.delete("/bans/perma/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    if (id && !isNaN(Number(id))) {
        try {
            const response = await fetch(global.webApi.url + "/bans/" + id, {
                method: "DELETE",
                headers: { "x-api-key": global.webApi.key },
            });
            if (response.ok) {
                res.send("Permaban eliminado");
            } else {
                throw new Error("Error al eliminar permaban");
            }
        } catch (err) {
            res.status(500).send("Error: " + err);
        }
    } else {
        res.status(400).send("ID inválido");
    }
});

export default service;
