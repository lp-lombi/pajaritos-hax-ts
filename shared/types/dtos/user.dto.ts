import { StatsDto, SubscriptionDto, WalletDto } from "./misc.dto";

export interface GetUserDto {
    id: number;
    username: string;
    role: number;
    discordId: string | null;
    createDate: string;
    lastLoginDate: string | null;
    stats: StatsDto | null; // Puede ser null ya que se podrán obtener DTOs de otras temporadas
    wallet: WalletDto;
    subscription: SubscriptionDto | null;
}

export interface RegisterRequestDto {
    username: string;
    password: string;
    discordId?: string | null;
}

export interface LoginRequestDto {
    username: string;
    password: string;
}