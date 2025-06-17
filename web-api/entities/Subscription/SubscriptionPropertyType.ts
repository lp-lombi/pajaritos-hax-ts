import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("subscription_property_types")
export class SubscriptionPropertyType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "integer" })
    tier: number;
}