import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, AfterInsert } from "typeorm";
import { Stats } from "./Stats";
import { dateTransformer, nullableDateTransformer } from "../utils/transformers";
import { Subscription } from "./Subscription/Subscription";
import { AppDataSource } from "../db/data-source";
import { Season } from "./Season";
import { Wallet } from "./Economy";

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

    @OneToOne(() => Wallet, wallet => wallet.user)
    wallet: Wallet;

    @OneToOne(() => Subscription, subscription => subscription.user, { nullable: true })
    subscription: Subscription | null;

    @AfterInsert()
    async createStats() {
        const statsRepository = AppDataSource.getRepository(Stats);
        const seasonRepository = AppDataSource.getRepository(Season);
        const currentSeason = await seasonRepository.findOneOrFail({ where: { isCurrent: true } });
        const stats = statsRepository.create({ user: this, season: currentSeason });
        await statsRepository.save(stats);
    }

    @AfterInsert()
    async createWallet() {
        const walletRepository = AppDataSource.getRepository(Wallet);
        const wallet = walletRepository.create({ user: this, userId: this.id });
        await walletRepository.save(wallet);
    }
}
