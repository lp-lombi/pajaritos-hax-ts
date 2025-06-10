import { Router, Request, Response } from "express";

const service = Router();

service.get("/users", async (req: Request, res: Response) => {
    const subscribedFilter = req.query.subscribed === "true";
    try {
        const response = await fetch(
            global.webApi.url + `/users${subscribedFilter ? "?subscribed=true" : ""}`,
            {
                method: "GET",
                headers: { "x-api-key": global.webApi.key },
            }
        );
        if (!response.ok) {
            throw new Error("Error al obtener usuarios");
        }
        const users = await response.json();
        res.send(users);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error al obtener usuarios");
    }
});

service.post("/users/:id/subscription", async (req: Request, res: Response) => {
    const id = req.params.id;
    if (id && !isNaN(Number(id))) {
        try {
            const response = await fetch(global.webApi.url + "/users/" + id + "/subscription", {
                method: "POST",
                headers: { "x-api-key": global.webApi.key, "Content-Type": "application/json" },
                body: JSON.stringify(req.body),
            });
            if (response.ok) {
                res.send("Suscripción actualizada");
            } else {
                console.error("Error al actualizar la suscripción:", response.statusText);
                throw new Error("Error al actualizar la suscripción");
            }
        } catch (err) {
            res.status(500).send("Error: " + err);
        }
    } else {
        res.status(400).send("ID inválido");
    }
});

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
                method: "PUT",
                headers: { "x-api-key": global.webApi.key, "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false }), // Cambiamos el estado a no permanente
            });
            if (response.ok) {
                res.send("Permaban eliminado");
            } else {
                console.error("Error al eliminar permaban:", response.statusText);
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
