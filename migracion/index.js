const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const newDbPath = path.join(__dirname, "webapi.db");
const oldDbPath = path.join(__dirname, "webapilive.db");

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
    odb.serialize(() => {
        odb.all("SELECT id, username, password, role FROM users", [], (err, oldUsers) => {
            if (err) {
                console.error("Error fetching data from old database:", err.message);
                return;
            }

            const stmt = ndb.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)");
            oldUsers.forEach((user) => {
                stmt.run(user.id, user.username, user.password, user.role, (err) => {
                    if (err) {
                        console.error("Error inserting data into new database:", err.message);
                        return;
                    }
                    console.log(`Migrated user: ${user.username}`);
                });
            });
            stmt.finalize(() => {
                console.log("Migration completed successfully.");
                ndb.close();
                odb.close();
            });
        });
    });
};

const migrateStats = () => {
    odb.serialize(() => {
        odb.all("SELECT id, score, assists, matches, wins FROM users", [], (err, oldStats) => {
            if (err) {
                console.error("Error fetching data from old database:", err.message);
                return;
            }

            const stmt = ndb.prepare("INSERT INTO stats (userId, seasonId, score, assists, matches, wins) VALUES (?, ?, ?, ?, ?, ?)");
            oldStats.forEach((stat) => {
                stmt.run(stat.id, 1, stat.score, stat.assists, stat.matches, stat.wins, (err) => {
                    if (err) {
                        console.error("Error inserting data into new database:", err.message);
                        return
                    }
                    console.log(`Migrated stats for user ID: ${stat.id}`);
                });
            });
            stmt.finalize(() => {
                console.log("Stats migration completed successfully.");
            });
        });
    });
}

const migrateSubscriptions = () => {
    odb.serialize(() => {
        odb.all("SELECT * FROM subscriptions", [], (err, oldSubscriptions) => {
            if (err) {
                console.error("Error fetching data from old database:", err.message);
                return;
            }

            const stmt = ndb.prepare("INSERT INTO subscriptions (userId, tier, startDate, scoreAnimId, scoreMessage, assistMessage, joinMessage, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            oldSubscriptions.forEach((sub) => {
                stmt.run(
                    sub.userId,
                    sub.tier,
                    sub.startDate,
                    sub.scoreAnimId,
                    sub.scoreMessage,
                    sub.assistMessage,
                    sub.joinMessage,
                    sub.emoji,
                    (err) => {
                        if (err) {
                            console.error("Error inserting data into new database:", err.message);
                            return;
                        }
                        console.log(`Migrated subscription for user ID: ${sub.userId}`);
                    }
                );
            });
            stmt.finalize(() => {
                console.log("Subscriptions migration completed successfully.");
            });
        });
    });
};

const migrate = () => {
    if (!fs.existsSync(newDbPath)) {
        console.error("New database file does not exist. Please check the path.");
        return;
    }

    if (!fs.existsSync(oldDbPath)) {
        console.error("Old database file does not exist. Please check the path.");
        return;
    }

    migrateUsers();
    migrateStats();
    migrateSubscriptions();
}

migrate();