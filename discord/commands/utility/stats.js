const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { webApi } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder().setName("stats").setDescription("Muestra los stats."),
    async execute(interaction) {
        if (webApi && webApi.url && global.apiKey) {
            fetch(webApi.url + "/users?stats=true", {
                headers: {
                    "x-api-key": global.apiKey,
                },
            })
                .then(async (res) => {
                    if (res.ok) {
                        res.json().then(async (data) => {
                            console.log(data)
                            if (data.users && data.users.length > 0) {

                                const users = data.users.sort((a, b) => b.stats.rating - a.stats.rating);
                                const maxScorer = users.reduce((prev, current) =>
                                    prev.stats.score > current.stats.score ? prev : current
                                );
                                const maxAssister = users.reduce((prev, current) =>
                                    prev.stats.assists > current.stats.assists ? prev : current
                                );
                                const maxWinrate = users.reduce((prev, current) => {
                                    const prevWinrate = prev.stats.wins / prev.stats.matches;
                                    const currentWinrate = current.stats.wins / current.stats.matches;
                                    return prevWinrate > currentWinrate ? prev : current;
                                });
                                

                                let top = 15;
                                let statsStr = "";
                                for (let i = 1; i < top && i < users.length; i++) {
                                    let u = users[i];
                                    statsStr += `${i + 1}. **${u.username}:** - ${u.stats.rating}\n`;
                                }

                                const embed = new EmbedBuilder()
                                    .setColor(0xf48414)
                                    .setTitle("Stats de PAJARITOS HAX")
                                    .addFields(
                                        { name: "\u200B", value: "\u200B" },
                                        {
                                            name: `1. ${users[0].username} - ${users[0].stats.rating}`,
                                            value: statsStr,
                                        },
                                        { name: "\u200B", value: "\u200B" },
                                        {
                                            name: "Máximo goleador",
                                            value: `${maxScorer.username} (${maxScorer.stats.score})`,
                                            inline: true,
                                        },
                                        {
                                            name: "Máximo asistidor",
                                            value: `${maxAssister.username} (${maxAssister.stats.assists})`,
                                            inline: true,
                                        },
                                        {
                                            name: "Mayor winrate",
                                            value: `${maxWinrate.username} (${(maxWinrate.stats.wins / maxWinrate.stats.matches)?.toFixed(
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
