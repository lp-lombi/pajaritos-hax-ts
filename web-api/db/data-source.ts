import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { User } from "../entities/User";
import { Season } from "../entities/Season";
import { Stats } from "../entities/Stats";
import { Ban } from "../entities/Ban";
import { Subscription } from "../entities/Subscription/Subscription";
import { SubscriptionProperty } from "../entities/Subscription/SubscriptionProperty";
import { SubscriptionPropertyType } from "../entities/Subscription/SubscriptionPropertyType";
import { Transaction, Wallet } from "../entities/Economy";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "database.sqlite"),
    synchronize: true,
    logging: false,
    entities: [
        User,
        Season,
        Stats,
        Ban,
        Subscription,
        SubscriptionProperty,
        SubscriptionPropertyType,
        Wallet,
        Transaction,
    ],
    migrations: [],
    subscribers: [],
});

export const subscriptionPropertyTypes: Omit<SubscriptionPropertyType, "id">[] = [
    {
        name: "scoreAnimId",
        description: "ID de la animación al hacer un gol",
        tier: 1,
    },
    {
        name: "chatColor",
        description: "Color el mensaje al chatear",
        tier: 1,
    },
    {
        name: "scoreMessage",
        description: "Mensaje al hacer un gol",
        tier: 1,
    },

    {
        name: "joinMessage",
        description: "Mensaje al unirse a la sala",
        tier: 1,
    },
    {
        name: "emoji",
        description: "Emoji personalizado al chatear",
        tier: 1,
    },
];

/**
 * Inserta valores predeterminados en la base de datos si es que no se los encuentra.
 */
export async function defaultDbValues() {
    const seasonRepository = AppDataSource.getRepository(Season);
    const subscriptionPropertyTypeRepository =
        AppDataSource.getRepository(SubscriptionPropertyType);

    const currentSeason = await seasonRepository.findOneBy({ isCurrent: true });
    if (!currentSeason) {
        const newSeason = seasonRepository.create({ name: "Pajaritos Hax", isCurrent: true });
        await seasonRepository.save(newSeason);
        console.log("Temporada actual creada:", newSeason);
    }
    const existingProperties = await subscriptionPropertyTypeRepository.find();
    if (existingProperties.length === 0) {
        const propertiesToInsert = subscriptionPropertyTypes.map((prop) =>
            subscriptionPropertyTypeRepository.create(prop)
        );
        await subscriptionPropertyTypeRepository.save(propertiesToInsert);
        console.log("Propiedades de suscripción predeterminadas insertadas:", propertiesToInsert);
    }

    const usersRepository = AppDataSource.getRepository(User);
    const rootUser = await usersRepository.findOneBy({ role: 3 });
    if (!rootUser) {
        const newRootUser = usersRepository.create({
            username: process.env["ROOT_USERNAME"]!,
            password: process.env["ROOT_PASSWORD"]!,
            role: 3,
        });
        await usersRepository.save(newRootUser);
        console.log("Usuario root creado:", newRootUser);
    }
}
