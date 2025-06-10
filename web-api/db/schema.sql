CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL,
	"username"	TEXT NOT NULL,
	"password"	TEXT NOT NULL,
	"discordId"	TEXT,
	"role"	INTEGER NOT NULL DEFAULT 0,
	"createDate"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"lastLoginDate"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "seasons" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	"isCurrent"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "stats" (
	"id"	INTEGER NOT NULL,
	"userId"	INTEGER,
	"seasonId"	INTEGER,
	"score"	INTEGER NOT NULL DEFAULT 0,
	"assists"	INTEGER NOT NULL DEFAULT 0,
	"matches"	INTEGER NOT NULL DEFAULT 0,
	"wins"	INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY("userId") REFERENCES "users"("id"),
	FOREIGN KEY("seasonId") REFERENCES "seasons"("id"),
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id"	INTEGER NOT NULL,
	"userId"	INTEGER,
	"tier"	INTEGER,
	"startDate"	TEXT,
	"scoreAnimId"	INTEGER,
	"scoreMessage"	TEXT,
	"assistMessage"	TEXT,
	"joinMessage"	TEXT, emoji TEXT,
	FOREIGN KEY("userId") REFERENCES "users"("id"),
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "bans" (
	"id"	INTEGER NOT NULL,
	"toUserId"	INTEGER,
	"toUserName"	TEXT,
	"byUserId"	INTEGER,
	"reason"	TEXT,
	"startDate"	TEXT,
	"days"	INTEGER,
	"ip"	TEXT,
	"auth"	TEXT,
	"isPermanent"	INTEGER,
	"isActive"	INTEGER,
	FOREIGN KEY("byUserId") REFERENCES "users"("id"),
	FOREIGN KEY("toUserId") REFERENCES "users"("id"),
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE VIEW vw_admins AS SELECT id AS userID, username, role FROM users WHERE role > 0;
CREATE VIEW vw_stats AS SELECT id AS userID, username, score, assists, wins, matches FROM users WHERE score > 0 OR assists > 0 OR matches > 0 ORDER BY (score) DESC;
CREATE VIEW vw_subs_settings AS SELECT s.username, ss.scoreAnimId, ss.scoreMessage, ss.assistMessage, ss.joinMessage, ss.emoji FROM vw_subs s INNER JOIN subscriptions ss ON s.userId = ss.userId;
CREATE VIEW vw_bans AS SELECT b.id AS banId, b.name AS playerName, b.userId AS playerUserId, b.ip AS ip, b.isPermanent AS isPermanent, u.username AS byAdmin FROM bans b INNER JOIN users u WHERE u.id = b.byId;
CREATE VIEW vw_subs AS SELECT s.id, u.id AS userID, u.username, s.tier, s.startDate FROM users u INNER JOIN subscriptions s ON s.userID = u.id;
CREATE VIEW vw_bans_stats AS SELECT username AS admin, 
       (SELECT COUNT(*) FROM vw_bans WHERE byAdmin = username) AS total_bans, (SELECT COUNT(*) FROM vw_bans WHERE byAdmin = username AND isPermanent = 1) AS permabans
FROM users WHERE role > 0;

CREATE TRIGGER delete_previous_subscription
BEFORE INSERT ON subscriptions
FOR EACH ROW
BEGIN
    DELETE FROM subscriptions WHERE userId = NEW.userId;
END;
