const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { webApi } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Muestra los links de las salas abiertas."),
    async execute(interaction) {
        if (webApi && webApi.url && global.apiKey) {
            fetch(webApi.url + "/rooms", {
                headers: {
                    "x-api-key": global.apiKey,
                },
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    else console.log(res.statusText);
                })
                .then(async (data) => {
                    if (data.rooms && data.rooms.length) {
                        const embed = new EmbedBuilder()
                            .setColor(0xf48414)
                            .setTitle("Salas abiertas")
                            .addFields({ name: "\u200B", value: "\u200B" })
                            .setTimestamp()
                            .setFooter({
                                text: "VIVA LA COMBA",
                            });
                        data.rooms.forEach((r) => {
                            embed
                                .addFields({
                                    name: `${r.name}`,
                                    value: `${r.players}/${r.maxPlayers} jugadores - ${r.link}\n`,
                                })
                                .addFields({ name: "\u200B", value: "\u200B" });
                        });

                        await interaction.reply({ embeds: [embed] });
                    } else {
                        await interaction.reply("No hay salas abiertas.");
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    },
};
