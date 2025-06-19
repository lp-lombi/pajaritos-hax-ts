const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { webApi } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder().setName("stats").setDescription("Muestra los stats."),
    async execute(interaction) {
        if (webApi && webApi.url && webApi.key) {
            fetch(webApi.url + "/users/stats/all", {
                headers: {
                    "x-api-key": webApi.key,
                },
            })
                .then(async (res) => {
                    if (res.ok) {
                        res.json().then(async (data) => {
                            if (data.stats && data.stats.length > 0) {
                                console.log(data);

                                data.stats.sort((a, b) => b.rating - a.rating);

                                let top = 15;
                                let statsStr = "";
                                for (let i = 1; i < top && i < data.stats.length; i++) {
                                    let stat = data.stats[i];
                                    statsStr += `${i + 1}. **${stat.username}:** - ${stat.rating}\n`;
                                }

                                const embed = new EmbedBuilder()
                                    .setColor(0xf48414)
                                    .setTitle("Stats de PAJARITOS HAX")
                                    .addFields(
                                        { name: "\u200B", value: "\u200B" },
                                        {
                                            name: `1. ${data.stats[0].username} - ${data.stats[0].rating}`,
                                            value: statsStr,
                                        },
                                        { name: "\u200B", value: "\u200B" },
                                        {
                                            name: "Máximo goleador",
                                            value: `${data.maxScorer.username} (${data.maxScorer.score})`,
                                            inline: true,
                                        },
                                        {
                                            name: "Máximo asistidor",
                                            value: `${data.maxAssister.username} (${data.maxAssister.assists})`,
                                            inline: true,
                                        },
                                        {
                                            name: "Mayor winrate",
                                            value: `${data.maxWinrate?.username} (${data.maxWinrate?.winrate.toFixed(
                                                3
                                            )})`,
                                            inline: true,
                                        }
                                    )
                                    .setTimestamp()
                                    .setFooter({
                                        text: "VIVA LA COMBA",
                                    });

                                await interaction.reply({ embeds: [embed] });
                            } else {
                                await interaction.reply("Por algún extraño motivo no hay stats.");
                            }
                        });
                    } else {
                        console.log("discord stats: " + res.statusText);
                        await interaction.reply("Error :c");
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    },
};
