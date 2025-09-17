import { Entity, PrimaryColumn, OneToOne, JoinColumn, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { dateTransformer } from "../utils/transformers";

export type TransactionType = "reward" | "purchase" | "penalty" | "transfer";

@Entity("wallets")
export class Wallet {
    @PrimaryColumn()
    userId: number;

    @OneToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "integer", default: 0 })
    balance: number;

    @Column({ type: "integer", default: 0 })
    totalEarned: number;

    @Column({ type: "integer", default: 0 })
    totalSpent: number;
}

@Entity("transactions")
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    toUser: User;

    @ManyToOne(() => User, { nullable: true })
    byUser: User | null;

    @Column({ type: "text" })
    type: TransactionType;

    @Column({ type: "integer" })
    amount: number;

    @Column({
        type: "text",
        default: () => "CURRENT_TIMESTAMP",
        transformer: dateTransformer,
    })
    date: Date;
}
