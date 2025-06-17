import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Season } from "./Season";

@Entity("stats")
export class Stats {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "numeric", default: 0})
    score: number;

    @Column({type: "numeric", default: 0})
    assists: number;

    @Column({type: "numeric", default: 0})
    matches: number;

    @Column({type: "numeric", default: 0})
    wins: number;

    @ManyToOne(() => User, (user) => user.stats)
    user: User;

    @ManyToOne(() => Season, (season) => season.stats)
    season: Season;
}
