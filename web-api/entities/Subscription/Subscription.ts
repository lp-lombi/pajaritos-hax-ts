import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { dateTransformer } from "../../utils/transformers";
import { User } from "../User";
import { SubscriptionProperty } from "./SubscriptionProperty";

@Entity("subscriptions")
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tier: number;

    @Column({
        type: "text",
        transformer: dateTransformer,
        default: () => "CURRENT_TIMESTAMP",
    })
    startDate: Date;

    @OneToOne(() => User, (user) => user.subscription)
    @JoinColumn()
    user: User;

    @OneToMany(() => SubscriptionProperty, (property) => property.subscription)
    properties: SubscriptionProperty[];
}
