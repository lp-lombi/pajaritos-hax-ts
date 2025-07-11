const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { webApi, discordApiToken } = require("./config.json");

async function getApiKey() {
    const loginRes = await fetch(webApi.url + "/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: webApi.user.username,
            password: webApi.user.password,
        }),
    });
    if (loginRes.ok) {
        const { token } = await loginRes.json();
        const apiKeyRes = await fetch(webApi.url + "/auth/api-key", {
            headers: {
                Authorization: token,
            },
        });
        if (apiKeyRes.ok) {
            const { apiKey } = await apiKeyRes.json();
            if (apiKey) {
                return apiKey;
            } else {
                throw new Error("No se pudo obtener la clave API.");
            }
        }
    } else {
        throw new Error("No se pudo obtener la clave API: " + loginRes.statusText);
    }
}

async function init() {
    try {
        global.apiKey = await getApiKey();
    } catch (error) {
        console.error("Error al inicializar la clave API:", error);
        return;
    }

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    client.once(Events.ClientReady, (readyClient) => {
        console.log(`Bot de discord listo: ${readyClient.user.tag}`);
    });

    client.commands = new Collection();
    const foldersPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ("data" in command && "execute" in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(
                    `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
    });

    const chat = (msg) => {
        console.log("Chat: " + msg);
        const channel = client.channels.cache.get("882220186118271001");
        if (channel) {
            channel.send(msg);
        }
    };

    client.login(discordApiToken);
}

init();
