import { GetUserDto } from "./user.dto";

export interface GetBanDto {
    id: number;
    name: string;
    user: GetUserDto | null;
    byUser: Omit<Omit<GetUserDto, "stats">, "subscription"> | null;
    reason: string | null;
    startDate: string;
    days: number;
    ip: string;
    auth: string;
    isPermanent: boolean;
    isActive: boolean;
}
