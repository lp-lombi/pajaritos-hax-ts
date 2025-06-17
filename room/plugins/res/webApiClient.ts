import { GetUserDto, LoginRequestDto } from "@shared/types/dtos/user.dto";
import { PajaritosBaseLib, WebApiData } from "../../types";
import { StatsDto, SubscriptionDto } from "shared/types/dtos/misc.dto";

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

    // TODO: definir el endpoint para los stats
    async getAllUsers(filterWithStats = false) {
        try {
            const url = this.webApiData.url + "/users" + (filterWithStats ? "?stats=true" : "");
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
            const dto: LoginRequestDto = { username, password }
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
            if (data.subscription) {
                return data.subscription as SubscriptionDto;
            } else {
                console.error("Error al actualizar los datos de suscripción: " + response.status);
                return null;
            }
        } catch (error) {
            console.error("Error al actualizar los datos de suscripción: " + error);
            return null;
        }
    }
}
