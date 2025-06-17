import { Database } from "sqlite3";
import { DbBan, DbUserSubscription } from "../types";
import { AppDataSource } from "../db/data-source";
import { Subscription } from "../entities/Subscription";
import { SubscriptionDto } from "@shared/types/dtos/misc.dto";
import { createSubscriptionDto } from "../utils/dto-mappers";

export class SubscriptionsService {
    private static instance: SubscriptionsService;
    constructor(private subscriptionsRepository = AppDataSource.getRepository(Subscription)) {}
    static getInstance(): SubscriptionsService {
        if (!this.instance) {
            this.instance = new SubscriptionsService();
        }
        return this.instance;
    }

    async getAllSubscriptions(): Promise<SubscriptionDto[]> {
        const subscriptions = await this.subscriptionsRepository.find();
        return subscriptions.map((sub) => createSubscriptionDto(sub));
    }

    async getSubscriptionByUserId(userId: number): Promise<SubscriptionDto | null> {
        const subscription = await this.subscriptionsRepository.findOne({
            where: { user: { id: userId } },
        });
        if (!subscription) {
            return null;
        }
        return createSubscriptionDto(subscription);
    }

    async createSubscription(
        userId: number,
        tier: number,
        startDate: string
    ): Promise<SubscriptionDto> {
        const newSubscription = this.subscriptionsRepository.create({
            user: { id: userId },
            tier,
            startDate,
        });
        await this.subscriptionsRepository.save(newSubscription);
        return createSubscriptionDto(newSubscription);
    }

    async updateSubscription(
        userId: number,
        newData: Partial<DbUserSubscription>
    ): Promise<SubscriptionDto | null> {
        const subscription = await this.subscriptionsRepository.findOne({
            where: { user: { id: userId } },
        });
        if (!subscription) {
            return null;
        }
        Object.assign(subscription, newData);
        await this.subscriptionsRepository.save(subscription);
        return createSubscriptionDto(subscription);
    }

    async deleteSubscriptionByUserId(userId: number): Promise<boolean> {
        const subscription = await this.subscriptionsRepository.findOne({
            where: { user: { id: userId } },
        });
        if (!subscription) {
            return false;
        }
        await this.subscriptionsRepository.remove(subscription);
        return true;
    }
}
