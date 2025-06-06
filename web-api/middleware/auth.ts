import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserDto } from "@shared/types/webApiDTO";
import { ApiKey } from "../utils/ApiKey";

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("authorization")?.replace("Bearer ", "").trim();
    if (!authorization) {
        res.status(401).json({ error: "Authorization" });
        return;
    }

    let userDto: UserDto;
    try {
        userDto = jwt.verify(authorization, process.env.JWT_SECRET as jwt.Secret) as UserDto;
    } catch (error) {
        console.log("Error verifying token:", error);
        res.status(401).json({ error: "Invalid token" });
        return;
    }

    if (!userDto || userDto.role < 2) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}

export function isRoot(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("authorization")?.replace("Bearer ", "").trim();
    if (!authorization) {
        res.status(401).json({ error: "Authorization" });
        return;
    }

    let userDto: UserDto;
    try {
        userDto = jwt.verify(authorization, process.env.JWT_SECRET as jwt.Secret) as UserDto;
    } catch (error) {
        console.log("Error verifying token:", error);
        res.status(401).json({ error: "Invalid token" });
        return;
    }

    if (!userDto || userDto.role < 3) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header("x-api-key")?.trim();
    if (!apiKey) {
        res.status(401).json({ error: "x-api-key" });
        return;
    }
    if (apiKey !== ApiKey.get()) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    next();
}
