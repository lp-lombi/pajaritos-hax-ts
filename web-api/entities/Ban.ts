import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { User } from "./User";
import { booleanToNumberTransformer, dateTransformer } from "../utils/transformers";

@Entity("bans")
export class Ban {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "toUserId" })
    toUser: User | null;

    @Column({ type: "text" })
    toUserName: string; // Se registra el nombre ya que puede no haberse logueado

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "byUserId" })
    byUser: User | null;

    @Column({ type: "text", nullable: true })
    reason: string | null;

    @Column({ type: "text", default: () => "CURRENT_TIMESTAMP", transformer: dateTransformer })
    startDate: Date;

    @Column({ type: "numeric", default: 0 })
    days: number;

    @Column({ type: "text" })
    ip: string;

    @Column({ type: "text" })
    auth: string;

    @Column({ type: "numeric", transformer: booleanToNumberTransformer, default: 0 })
    isPermanent: boolean;

    @Column({ type: "numeric", transformer: booleanToNumberTransformer, default: 0 })
    isActive: boolean;
}
