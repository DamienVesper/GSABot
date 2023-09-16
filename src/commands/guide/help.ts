import config from '../../../config/config';

import { SlashCommandBuilder } from '@discordjs/builders';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type ChatInputCommandInteraction,
    EmbedBuilder
} from 'discord.js';

import type { Client } from '../../typings/discord';

const cmd: SlashCommandBuilder = new SlashCommandBuilder()
    .setName(`help`)
    .setDescription(`View the help menu.`);

const run = async (client: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
    /* eslint-disable-next-line @typescript-eslint/prefer-optional-chain */
    if (interaction.guild === null || interaction.guild.rulesChannel === null) return;

    const sEmbed = new EmbedBuilder()
        .setColor(config.colors.blue)
        .setAuthor({ name: `Help`, iconURL: interaction.guild?.iconURL() ?? undefined })
        .setImage(`https://media.makeameme.org/created/i-dont-know-5ad107.jpg`)
        .setDescription(`A little confused on what to do here? Me too.`)
        .setTimestamp()
        .setFooter({ text: config.footer });

    const sRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.guild.rulesChannel.id}`)
            .setLabel(`Rules`)
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setURL(`https://github.com/DamienVesper/GeneshiftBot`)
            .setLabel(`GitHub`)
            .setStyle(ButtonStyle.Link)
    );

    await interaction.reply({
        embeds: [sEmbed],
        components: [sRow]
    });
};

export {
    cmd,
    run
};
