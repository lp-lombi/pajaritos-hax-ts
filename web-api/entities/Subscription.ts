import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { dateTransformer } from "../utils/transformers";

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

    @Column({ type: "integer", nullable: true })
    scoreAnimId: number | null;

    @Column({ type: "text", nullable: true })
    scoreMessage: string | null;

    @Column({ type: "text", nullable: true })
    assistMessage: string | null;

    @Column({ type: "text", nullable: true })
    joinMessage: string | null;

    @Column({ type: "text", nullable: true })
    emoji: string | null;

    @OneToOne(() => User, (user) => user.subscription)
    @JoinColumn()
    user: User;
}
