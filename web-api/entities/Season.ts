import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert } from "typeorm";
import { Stats } from "./Stats";
import { booleanToNumberTransformer } from "../utils/transformers";
import { AppDataSource } from "../db/data-source";

@Entity("seasons")
export class Season {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, default: "Pajaritos Hax" })
    name: string;

    @Column({ type: "numeric", default: 1, transformer: booleanToNumberTransformer })
    isCurrent: boolean;

    @OneToMany(() => Stats, (stats) => stats.season)
    stats: Stats[];

    @BeforeInsert()
    async disableCurrentSeason() {
        const seasonsRepository = AppDataSource.getRepository(Season);
        const currentSeason = await seasonsRepository.findOne({
            where: { isCurrent: true },
        });
        if (currentSeason) {
            currentSeason.isCurrent = false;
            seasonsRepository.save(currentSeason);
        }
    }
}
