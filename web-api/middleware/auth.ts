import { UserDto } from "@shared/types/webApiDTO";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user: UserDto;
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("authorization")?.replace("Bearer ", "").trim();

    if (!authorization) {
        res.status(401).json({ error: "Unauthorized" });
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

    (req as AuthRequest).user = userDto;
    next();
}
