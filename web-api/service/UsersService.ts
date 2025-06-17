import bcrypt from "bcrypt";
import { AppDataSource } from "../db/data-source";
import { User } from "../entities/User";
import { DeepPartial } from "typeorm";
import { Stats } from "../entities/Stats";
import { Season } from "../entities/Season";
import { GetUserDto } from "@shared/types/dtos/user.dto";
import { createUserDto } from "../utils/dto-mappers";

export interface UserFilters {
    withMatches?: boolean;
    subscribed?: boolean;
    byRole?: number;
    bySeasonId?: number;
}

export class UsersService {
    private static instance: UsersService;
    private constructor(
        private usersRepository = AppDataSource.getRepository(User),
        private statsRepository = AppDataSource.getRepository(Stats),
        private seasonsRepository = AppDataSource.getRepository(Season)
    ) {}

    static getInstance(): UsersService {
        if (!this.instance) {
            this.instance = new UsersService();
        }
        return this.instance;
    }

    userQuery(filter: UserFilters = {}) {
        const query = this.usersRepository.createQueryBuilder("user")
            .leftJoinAndSelect("user.stats", "stats")
            .leftJoinAndSelect("user.subscription", "subscription")
            .leftJoinAndSelect("subscription.properties", "property")
            .leftJoinAndSelect("property.type", "type")
            .leftJoinAndSelect("stats.season", "season");
        if (filter.withMatches) {
            query.andWhere("stats.matches > :matches", { matches: 0 });
        }
        if (filter.subscribed === true) {
            query.andWhere("subscription.id IS NOT NULL");  
        } else if (filter.subscribed === false) {
            query.andWhere("subscription.id IS NULL");
        }
        if (filter.byRole !== undefined) {
            query.andWhere("user.role = :role", { role: filter.byRole });
        }
        if (filter.bySeasonId !== undefined) {
            query.andWhere("season.id = :seasonId", { seasonId: filter.bySeasonId });
        }
        return query;
    }

    /**
     * Obtiene todos los usuarios, opcionalmente filtrando por stats (temporada actual) y suscripción.
     */
    async getAllUsers(filter: UserFilters): Promise<GetUserDto[]> {
        const users = await this.userQuery(filter).getMany();
        return users.map((user) => {
            return createUserDto(
                user,
                user.stats[0] || null,
                user.subscription
            );
        });
    }

    /**
     * Obtiene un usuario por su ID.
     */
    async getUserById(id: number): Promise<GetUserDto | null> {
        const user = await this.userQuery().where("user.id = :id", { id }).getOne();
        return user
            ? createUserDto(
                  user,
                  user.stats.find((s) => s.season.isCurrent) || null,
                  user.subscription
              )
            : null;
    }

    async getUserByUsername(username: string): Promise<GetUserDto | null> {
        const user = await this.userQuery().where("user.username = :username", { username }).getOne();
        return user ? createUserDto(
            user,
            user.stats.find((s) => s.season.isCurrent) || null,
            user.subscription
        ) : null;
    }

    /**
     * Crea un nuevo usuario y asigna estadísticas iniciales para la temporada actual.
     */
    async createUser(
        username: string,
        password: string,
        role: number,
        discordId: string | null = null
    ): Promise<GetUserDto> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const season = await this.seasonsRepository.findOneOrFail({ where: { isCurrent: true } });
        const user = this.usersRepository.create({
            username,
            password: hashedPassword,
            role,
            discordId,
            createDate: new Date(),
        });
        const newUser = await this.usersRepository.save(user);
        const stats = this.statsRepository.create({
            user: newUser,
            season
        });
        await this.statsRepository.save(stats);
        newUser.stats = [stats]; // Asignar las stats recién creadas al usuario
        return createUserDto(
            newUser,
            newUser.stats.find((s) => s.season.isCurrent) || null,
            newUser.subscription
        );
    }

    async updateUserById(id: number, newData: DeepPartial<User>): Promise<GetUserDto | null> {
        const user = await this.userQuery().where("user.id = :id", { id }).getOne();
        if (!user) return null;
        Object.assign(user, newData);
        const updatedUser = await this.usersRepository.save(user);
        return createUserDto(
            updatedUser,
            updatedUser.stats.find((s) => s.season.isCurrent) || null,
            updatedUser.subscription
        );
    }
}
