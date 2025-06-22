import { AppDataSource, subscriptionPropertyTypes } from "../db/data-source";
import { SubscriptionDto } from "@shared/types/dtos/misc.dto";
import { createSubscriptionDto } from "../utils/dto-mappers";
import { Subscription } from "../entities/Subscription/Subscription";
import { SubscriptionPropertyType } from "../entities/Subscription/SubscriptionPropertyType";
import { DeepPartial } from "typeorm";
import { SubscriptionProperty } from "../entities/Subscription/SubscriptionProperty";

export class SubscriptionsService {
    private static instance: SubscriptionsService;
    constructor(
        private subscriptionsRepository = AppDataSource.getRepository(Subscription),
        private subscriptionPropertyTypeRepository = AppDataSource.getRepository(
            SubscriptionPropertyType
        ),
        private subscriptionPropertiesRepository = AppDataSource.getRepository(SubscriptionProperty)
    ) {}

    static getInstance(): SubscriptionsService {
        if (!this.instance) {
            this.instance = new SubscriptionsService();
        }
        return this.instance;
    }

    subscriptionQuery() {
        return this.subscriptionsRepository
            .createQueryBuilder("subscription")
            .leftJoinAndSelect("subscription.properties", "property")
            .leftJoinAndSelect("property.type", "type")
    }

    async getAllSubscriptions(): Promise<SubscriptionDto[]> {
        const subscriptions = await this.subscriptionQuery().getMany();
        return subscriptions.map((sub) => createSubscriptionDto(sub));
    }

    async getSubscriptionByUserId(userId: number): Promise<SubscriptionDto | null> {
        const subscription = await this.subscriptionQuery()
            .where("subscription.userId = :userId", { userId })
            .getOne();
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
        const existingSubscription = await this.subscriptionQuery()
            .where("subscription.userId = :userId", { userId })
            .getOne();
        if (existingSubscription) {
            existingSubscription.startDate = new Date(startDate);
            await this.subscriptionsRepository.save(existingSubscription);
            return createSubscriptionDto(existingSubscription);
        }
        const newSubscription = this.subscriptionsRepository.create({
            user: { id: userId },
            tier,
            startDate: new Date(startDate),
            properties: [],
        });
        await this.subscriptionsRepository.save(newSubscription);
        return createSubscriptionDto(newSubscription);
    }

    async updateSubscription(
        userId: number,
        newData: any
    ): Promise<SubscriptionDto | null> {
        const subscription = await this.subscriptionQuery()
            .where("subscription.userId = :userId", { userId })
            .getOne();
        if (!subscription) {
            return null;
        }
        const updateSubObj: DeepPartial<Subscription> = {};
        if (newData.tier !== undefined) {
            updateSubObj.tier = newData.tier;
        }
        Object.assign(subscription, updateSubObj);
        await this.subscriptionsRepository.save(subscription);

        const subscriptionPropertyTypes = await this.subscriptionPropertyTypeRepository.find();
        for (const t of subscriptionPropertyTypes) {
            if (newData[t.name] !== undefined) {
                const updateProp: DeepPartial<SubscriptionProperty> = {
                    type: { id: t.id },
                    value: newData[t.name],
                };
                const existingProperty = await this.subscriptionPropertiesRepository.findOne({
                    where: {
                        subscription: { id: subscription.id },
                        type: { id: t.id },
                    },
                });
                if (existingProperty) {
                    Object.assign(existingProperty, updateProp);
                    await this.subscriptionPropertiesRepository.save(existingProperty);
                } else {
                    const newProperty = this.subscriptionPropertiesRepository.create({
                        ...updateProp,
                        subscription,
                    });
                    subscription.properties.push(newProperty);
                    await this.subscriptionPropertiesRepository.save(newProperty);
                }
            }
        }

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
