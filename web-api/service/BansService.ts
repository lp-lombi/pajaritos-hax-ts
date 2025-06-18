import { AppDataSource } from "../db/data-source";
import { Ban } from "../entities/Ban";
import { GetBanDto } from "@shared/types/dtos/ban.dto";
import { createBanDto } from "../utils/dto-mappers";
import { DeepPartial } from "typeorm";

export interface BanFilters {
    isPermanent?: boolean;
    isActive?: boolean;
    toUserId?: number;
    byUserId?: number;
}

export class BansService {
    private static instance: BansService;
    private constructor(
        private bansRepository = AppDataSource.getRepository(Ban),
    ) {}
    static getInstance(): BansService {
        if (!this.instance) {
            this.instance = new BansService();
        }
        return this.instance;
    }

    banQuery(filter: BanFilters = {}) {
        const query = this.bansRepository.createQueryBuilder("ban")
            .leftJoinAndSelect("ban.toUser", "toUser")
            .leftJoinAndSelect("ban.byUser", "byUser");
        if (filter.isPermanent !== undefined) {
            query.andWhere("ban.isPermanent = :isPermanent", { isPermanent: filter.isPermanent ? 1 : 0 });
        }
        if (filter.isActive !== undefined) {
            query.andWhere("ban.isActive = :isActive", { isActive: filter.isActive ? 1 : 0 });
        }
        if (filter.toUserId !== undefined) {
            query.andWhere("ban.toUserId = :toUserId", { toUserId: filter.toUserId });
        }
        if (filter.byUserId !== undefined) {
            query.andWhere("ban.byUserId = :byUserId", { byUserId: filter.byUserId });
        }
        return query;            
    }

    async getAllBans(filter: BanFilters = {}): Promise<GetBanDto[]> {
        const bans = await this.banQuery(filter).getMany();
        return bans.map(b => createBanDto(b, b.toUser, b.byUser));
    }

    async createBan(
        toUserId: number | null,
        toUserName: string,
        byUserId: number,
        reason: string | null,
        startDate: Date,
        days: number,
        ip: string,
        auth: string,
        isPermanent: boolean
    ): Promise<GetBanDto> {
        const newBan = this.bansRepository.create({
            toUser: toUserId ? { id: toUserId } : null,
            toUserName,
            byUser: { id: byUserId },
            reason,
            startDate,
            days,
            ip,
            auth,
            isPermanent,
            isActive: true,
        });
        const savedBan = await this.bansRepository.save(newBan);
        const banWithUsers = await this.banQuery().where("ban.id = :id", { id: savedBan.id }).getOneOrFail();
        return createBanDto(banWithUsers, banWithUsers.toUser, banWithUsers.byUser);
    }

    async updateBan(id: number, newData: Omit<DeepPartial<Ban>, "id">): Promise<GetBanDto | null> {
        const ban = await this.banQuery().where("ban.id = :id", { id }).getOne();
        if (!ban) return null;

        Object.assign(ban, newData);
        const updatedBan = await this.bansRepository.save(ban);
        return createBanDto(updatedBan, updatedBan.toUser, updatedBan.byUser);
    }
}