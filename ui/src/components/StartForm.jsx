import React, { useEffect, useState } from "react";
import { useApi } from "../services/ApiService";
import { usePopup } from "../services/PopupService";

export const StartForm = () => {
    const { startRoom, getDefaultConfig } = useApi();

    const { popupLoading } = usePopup();

    const [roomName, setRoomName] = useState("");
    const [roomPassword, setRoomPassword] = useState("");
    const [token, setToken] = useState("");
    const [botName, setBotName] = useState("");
    const [maxPlayers, setMaxPlayers] = useState(10);

    const handleMaxPlayersChange = (e) => {
        if (!isNaN(e.target.value) && e.target.value !== "") {
            setMaxPlayers(parseInt(e.target.value));
        } else {
            setMaxPlayers(2);
        }
    };

    const handleStart = async () => {
        if (roomName === "") {
            alert("El nombre no puede estar vacío");
        } else if (maxPlayers <= 1) {
            alert("El número de jugadores debe ser mayor a 1");
        } else if (token.length < 39) {
            alert("Verifica el token.");
        } else {
            startRoom({
                roomName,
                roomPassword,
                maxPlayers,
                botName,
                token,
            });
        }
    };

    useEffect(() => {
        getDefaultConfig().then((data) => {
            setRoomName(data.roomName);
            setRoomPassword(data.roomPassword);
            setMaxPlayers(data.maxPlayers);
            setBotName(data.botName);
            setToken(data.token);
        });
    }, []);

    return (
        <section className="start-form">
            <label htmlFor="roomName">Nombre de la sala</label>
            <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                name="roomName"
                type="text"
            />

            <label htmlFor="roomPassword">Contraseña</label>
            <input
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                name="roomPassword"
                type="text"
                placeholder="En blanco es sin contraseña"
            />

            <div className="flex" style={{ width: "90%" }}>
                <div
                    className="flex col"
                    style={{ gap: "1rem", width: "100%" }}
                >
                    <label htmlFor="botName">Nombre del bot</label>
                    <input
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        name="roomPassword"
                        type="text"
                        placeholder="En blanco es sin contraseña"
                        style={{
                            width: "100%",
                        }}
                    />
                </div>

                <div className="flex col" style={{ gap: "1rem", width: "30%" }}>
                    <label htmlFor="maxPlayers">Jugadores</label>
                    <input
                        value={maxPlayers}
                        onChange={handleMaxPlayersChange}
                        name="roomName"
                        type="number"
                        style={{ marginLeft: "1rem" }}
                    />
                </div>
            </div>

            <label htmlFor="token">Token</label>
            <div
                style={{
                    display: "flex",
                    width: "90%",
                }}
            >
                <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    name="token"
                    type="text"
                    placeholder="Pegar token acá (sin comillas)"
                    style={{ minWidth: "60%" }}
                />
                <button
                    style={{
                        marginLeft: "1rem",
                        fontSize: "14px",
                    }}
                    onClick={() =>
                        window.open("https://www.haxball.com/headlesstoken")
                    }
                >
                    Generar
                </button>
            </div>

            <button onClick={() => handleStart()}>Iniciar sala</button>
        </section>
    );
};

export default StartForm;
