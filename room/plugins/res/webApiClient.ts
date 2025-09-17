import { GetUserDto, LoginRequestDto } from "@shared/types/dtos/user.dto";
import { PajaritosBaseLib, WebApiData } from "../../types";
import { ErrorResponseDto, StatsDto, SubscriptionDto, TransactionDto } from "shared/types/dtos/misc.dto";

interface TransaccionResult {
    success: boolean;
    message: string;
}

export class WebApiClient {
    constructor(private webApiData: WebApiData, private phLib: PajaritosBaseLib) {}

    async getUser(userId: number) {
        try {
            const response = await fetch(`${this.webApiData.url}/users/${userId}`, {
                headers: { "x-api-key": this.webApiData.key },
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                if (data.user) {
                    return data.user as GetUserDto;
                }
                return null;
            } else {
                console.error("Error al obtener el usuario: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al obtener el usuario: " + error);
            return null;
        }
    }

    async getUserByUsername(username: string) {
        try {
            const response = await fetch(
                `${this.webApiData.url}/users?username=${encodeURIComponent(username)}`,
                {
                    headers: { "x-api-key": this.webApiData.key },
                }
            );
            if (response.ok) {
                const data = (await response.json()) as any;
                if (data.user) {
                    return data.user as GetUserDto;
                }
                return null;
            } else {
                console.error("Error al obtener el usuario: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al obtener el usuario: " + error);
            return null;
        }
    }

    async getCurrentSeasonId() {
        try {
            const response = await fetch(`${this.webApiData.url}/seasons/current`, {
                headers: { "x-api-key": this.webApiData.key },
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                if (data.season && data.season.id) {
                    return data.season.id as number;
                }
                return null;
            } else {
                throw new Error(response.statusText);
            }
        } catch (error) {
            console.error("Error al obtener la temporada actual: " + error);
            return null;
        }
    }

    // TODO: definir el endpoint para los stats
    async getAllUsers(filterWithStats = false, bySeasonId?: number) {
        try {
            const queryParams: string[] = [];
            if (filterWithStats) queryParams.push("stats=true");
            if (bySeasonId !== undefined) queryParams.push(`seasonId=${bySeasonId}`);
            const url =
                this.webApiData.url +
                "/users" +
                (queryParams.length > 0 ? "?" + queryParams.join("&") : "");
            const response = await fetch(url, {
                headers: { "x-api-key": this.webApiData.key },
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                return (data.users as GetUserDto[]) || [];
            } else {
                console.error("Error al obtener los usuarios: " + response.status);
                return [];
            }
        } catch (error) {
            console.error("Error al obtener los usuarios: " + error);
            return [];
        }
    }

    async requestLogin(username: string, password: string) {
        try {
            const dto: LoginRequestDto = { username, password };
            const response = await fetch(this.webApiData.url + "/auth/login", {
                method: "POST",
                headers: { "x-api-key": this.webApiData.key, "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                if (data.user) {
                    return data.user as GetUserDto;
                }
                return null;
            } else {
                console.error("Error al obtener el usuario: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al iniciar sesión: " + error);
            return null;
        }
    }

    async requestRegister(username: string, password: string) {
        try {
            const response = await fetch(this.webApiData.url + "/auth/register", {
                method: "POST",
                headers: { "x-api-key": this.webApiData.key, "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                if (data.user) {
                    return data.user as GetUserDto;
                }
                return null;
            } else {
                console.error("Error al crear el usuario: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al registrar el usuario: " + error);
            return null;
        }
    }

    async sumUserStats(userId: number, stats: Partial<StatsDto>) {
        try {
            const response = await fetch(this.webApiData.url + "/users/" + userId + "/stats/sum", {
                method: "POST",
                headers: {
                    "x-api-key": this.webApiData.key,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(stats),
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                if (data.user) {
                    return data.user as GetUserDto;
                }
                return null;
            } else {
                console.error("Error al sumar los stats del usuario: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al sumar los stats del usuario: " + error);
            return null;
        }
    }

    async updatePlayerSubscriptionData(
        playerId: number,
        subscriptionData: Partial<SubscriptionDto>
    ) {
        let p = this.phLib.getPlayer(playerId);
        if (!p || !p.user.subscription) {
            console.error("No se encontró el jugador o no tiene datos de suscripción");
            return null;
        }
        try {
            const response = await fetch(
                this.webApiData.url + "/users/" + p.user.id + "/subscription",
                {
                    method: "PATCH",
                    headers: {
                        "x-api-key": this.webApiData.key,
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(subscriptionData),
                }
            );
            if (!response.ok) {
                console.error("Error al actualizar los datos de suscripción: " + response.status);
                return null;
            }
            const data = (await response.json()) as any;
            if (data.user?.subscription) {
                return data.user?.subscription as SubscriptionDto;
            } else {
                console.error("Error al actualizar los datos de suscripción: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al actualizar los datos de suscripción: " + error);
            return null;
        }
    }

    async registerTransaction(
        toUserId: number,
        byUserId: number | null,
        amount: number,
        type: "reward" | "purchase" | "transfer" | "penalty" = "reward"
    ): Promise<TransaccionResult> {
        try {
            const response = await fetch(this.webApiData.url + "/economy/transaction", {
                method: "POST",
                headers: {
                    "x-api-key": this.webApiData.key,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ toUserId, byUserId, amount, type }),
            });
            if (response.ok) {
                const data = (await response.json()) as any;
                return { success: true, message: "Transacción registrada correctamente" };
            } else {
                const errorData = (await response.json()) as ErrorResponseDto;
                if (errorData && errorData.error) {
                    return { success: false, message: "Error: " + errorData.error };
                }
            }
        } catch (error) {
            console.error("Error al registrar la transacción: " + error);
        }
        return { success: false, message: "Error desconocido al registrar la transacción" };
    }
}
