import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from "typeorm";
import { Stats } from "./Stats";
import { dateTransformer, nullableDateTransformer } from "../utils/transformers";
import { Subscription } from "./Subscription/Subscription";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({type: "text", nullable: true })
    discordId: string | null;

    @Column({ default: 0 })
    role: number; // 0 = user, 1 = helper, 2 = admin, 3 = superadmin, 4 = root

    @Column({
        type: "text",
        default: () => "CURRENT_TIMESTAMP",
        transformer: dateTransformer,
    })
    createDate: Date;

    @Column({
        type: "text",
        nullable: true,
        transformer: nullableDateTransformer,
    })
    lastLoginDate: Date | null;

    @OneToMany(() => Stats, stats => stats.user)
    stats: Stats[];

    @OneToOne(() => Subscription, subscription => subscription.user, { nullable: true })
    subscription: Subscription | null;

}
