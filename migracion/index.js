const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const newDbPath = path.join(__dirname, "database.sqlite");
const oldDbPath = path.join(__dirname, "databaselive.db");

const ndb = new sqlite3.Database(newDbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    } else {
        console.log("Connected to the database.");
    }
});

const odb = new sqlite3.Database(oldDbPath, (err) => {
    if (err) {
        console.error("Error opening old database:", err.message);
        process.exit(1);
    } else {
        console.log("Connected to the old database.");
    }
});

const migrateUsers = () => {
    return new Promise((resolve, reject) => {
        odb.serialize(() => {
            odb.all("SELECT * FROM users", [], (err, oldUsers) => {
                if (err) {
                    console.error("Error fetching data from old database:", err.message);
                    return;
                }

                const stmt = ndb.prepare(
                    "INSERT INTO users (id, username, password, role, createDate, lastLoginDate) VALUES (?, ?, ?, ?, ?, ?)"
                );
                oldUsers.forEach((user) => {
                    stmt.run(
                        user.id,
                        user.username,
                        user.password,
                        user.role,
                        user.createDate,
                        user.lastLoginDate,
                        (err) => {
                            if (err) {
                                console.error(
                                    "Error inserting data into new database:",
                                    err.message
                                );
                                return;
                            }
                            console.log(`Migrated user: ${user.username}`);
                        }
                    );
                });
                stmt.finalize(() => {
                    console.log("Migration completed successfully.");
                    resolve();
                });
            });
        });
    });
};

const migrateStats = () => {
    return new Promise((resolve, reject) => {
        odb.serialize(() => {
            odb.all("SELECT * FROM stats", [], (err, oldStats) => {
                if (err) {
                    console.error("Error fetching data from old database:", err.message);
                    return;
                }

                const stmt = ndb.prepare(
                    "INSERT INTO stats (userId, seasonId, score, assists, matches, wins) VALUES (?, ?, ?, ?, ?, ?)"
                );
                oldStats.forEach((stat) => {
                    stmt.run(
                        stat.userId,
                        stat.seasonId,
                        stat.score,
                        stat.assists,
                        stat.matches,
                        stat.wins,
                        (err) => {
                            if (err) {
                                console.error(
                                    "Error inserting data into new database:",
                                    err.message
                                );
                                return;
                            }
                            console.log(`Migrated stats for user ID: ${stat.id}`);
                        }
                    );
                });
                stmt.finalize(() => {
                    console.log("Stats migration completed successfully.");
                    resolve();
                });
            });
        });
    });
};

const migrateSubscriptions = () => {
    return new Promise((resolve, reject) => {
        odb.serialize(() => {
            odb.all("SELECT * FROM subscriptions", [], (err, oldSubscriptions) => {
                if (err) {
                    console.error("Error fetching data from old database:", err.message);
                    return;
                }

                const stmt = ndb.prepare(
                    "INSERT INTO subscriptions (userId, tier, startDate) VALUES (?, ?, ?)"
                );
                oldSubscriptions.forEach((sub) => {
                    stmt.run(sub.userId, sub.tier, sub.startDate, (err) => {
                        if (err) {
                            console.error("Error inserting data into new database:", err.message);
                            return;
                        }
                        console.log(`Migrated subscription for user ID: ${sub.userId}`);
                    });
                });
                stmt.finalize(() => {
                    console.log("Subscriptions migration completed successfully.");
                    resolve();
                });
            });
        });
    });
};

const migrate = async () => {
    if (!fs.existsSync(newDbPath)) {
        console.error("New database file does not exist. Please check the path.");
        return;
    }

    if (!fs.existsSync(oldDbPath)) {
        console.error("Old database file does not exist. Please check the path.");
        return;
    }

    await migrateUsers();
    await migrateStats();
    await migrateSubscriptions();
}

migrate();