import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SubscriptionPropertyType } from "./SubscriptionPropertyType";
import { Subscription } from "./Subscription";

@Entity("subscription_properties")
export class SubscriptionProperty {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Subscription, (sub) => sub.properties)
    subscription: Subscription;

    @ManyToOne(() => SubscriptionPropertyType)
    type: SubscriptionPropertyType;

    @Column({ type: "text" })
    value: string;
}
