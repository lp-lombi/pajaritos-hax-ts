import { useEffect, useState } from "react";
import "./Subscriptions.css";
import { usePopup } from "../../services/PopupService";
import { useApi } from "../../services/ApiService";

export const Subscriptions = () => {
    const [subscribedUsers, setSubscribedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [nameFilter, setNameFilter] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

    const { fetchUsers, createSubscription } = useApi();
    const { popupConfirm } = usePopup();

    useEffect(() => {
        const fetchData = async () => {
            const users = await fetchUsers(true);
            if (!users) {
                console.error("Subs: Lista de usuarios vacía");
                return;
            }
            setSubscribedUsers(users);
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchAllUsers = async () => {
            const users = await fetchUsers();
            if (!users) {
                console.error("Subs: Lista de usuarios vacía");
                return;
            }
            console.log("Subs: Lista de usuarios", users);
            setAllUsers(users);
        };
        fetchAllUsers();
    }, [nameSearch]);

    const ActionButtons = {
        add: {
            label: "Cargar",
            onClick: () => {
                const user = allUsers.find((u) => u.username === nameSearch);
                if (!user) {
                    console.error("Subs: Usuario no encontrado");
                    return;
                }
                createSubscription(user.id, 1)
            },
        },
        remove: {
            label: "Eliminar",
            onClick: () => {
                popupConfirm(
                    "Eliminar suscripción",
                    `Se va a eliminar la suscripción de ${selectedUser?.username} (ID ${selectedUser?.id})`
                );
            },
        },
        update: {
            label: "Guardar",
            onClick: () => {
                popupConfirm(
                    "Actualizar suscripción",
                    `Se va a actualizar la suscripción de ${selectedUser?.username} (ID ${selectedUser?.id})`
                );
            },
        },
        close: {
            label: "Cerrar",
            onClick: () => {
                setSelectedUser(null);
            },
        },
    };

    const ActionButton = ({ type }) => {
        return (
            <button onClick={type.onClick} className="action-button">
                {type.label}
            </button>
        );
    };

    return (
        <div className="subscriptions">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Fecha</th>
                            <th>Tier</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscribedUsers
                            .filter((u) => {
                                return u?.username
                                    ?.toLowerCase()
                                    .includes(nameFilter.toLowerCase());
                            })
                            .map((u) => (
                                <tr
                                    key={u.id}
                                    className={selectedUser?.id === u.id ? "selected" : ""}
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.subscription.startDate}</td>
                                    <td>{u.subscription.tier}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            <div className="actions">
                <input
                    type="text"
                    placeholder="Filtrar por nombre"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                />
            </div>
            <div className="actions">
                {selectedUser ? (
                    <>
                        <h3>{selectedUser.username}</h3>

                        <div className="row">
                            <span>Tier</span>
                            <input type="number" value={selectedUser.subscription.tier} />
                        </div>
                        <div className="row">
                            <span>Fecha de inicio</span>
                            <span>{selectedUser.subscription.startDate}</span>
                        </div>
                        <div className="row">
                            <ActionButton type={ActionButtons.remove} />
                            <ActionButton type={ActionButtons.update} />
                            <ActionButton type={ActionButtons.close} />
                        </div>
                    </>
                ) : (
                    <>
                        <h3>Nueva suscripción</h3>
                        <div className="row">
                            <input
                                list="users"
                                name="user"
                                value={nameSearch}
                                onChange={(e) => setNameSearch(e.target.value)}
                            />
                            <datalist id="users">
                                {allUsers
                                    .filter((u) => u?.username?.includes(nameSearch))
                                    .map((user) => (
                                        <option key={user.id} value={user.username}>
                                            ID: {user.id}
                                        </option>
                                    ))}
                            </datalist>
                            <ActionButton type={ActionButtons.add} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Subscriptions;
