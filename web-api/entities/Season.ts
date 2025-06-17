import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Stats } from "./Stats";
import { booleanToNumberTransformer } from "../utils/transformers";

@Entity("seasons")
export class Season {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, default: "Pajaritos Hax" })
    name: string;

    @Column({ type: "numeric", default: 0, transformer: booleanToNumberTransformer })
    isCurrent: boolean;

    @OneToMany(() => Stats, (stats) => stats.season)
    stats: Stats[];
}
