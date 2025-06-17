import "reflect-metadata"
import { DataSource } from "typeorm"
import path from "path"
import { User } from "../entities/User"
import { Season } from "../entities/Season"
import { Stats } from "../entities/Stats"
import { Subscription } from "../entities/Subscription"
import { Ban } from "../entities/Ban"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "database.sqlite"),
    synchronize: true,
    logging: true,
    entities: [User, Season, Stats, Subscription, Ban],
    migrations: [],
    subscribers: [],
})
