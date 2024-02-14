import { type SlashCommandBuilder } from '@discordjs/builders';
import type { Client as DCClient, type ChatInputCommandInteraction } from 'discord.js';

interface Command {
    cmd: SlashCommandBuilder
    run: (client: DCClient, interaction: ChatInputCommandInteraction) => void
}

interface Event {
    callback: (...any) => void
}

interface Client extends DCClient {
    commands?: Map<string, Command>
    events?: Map<string, Event>

    servers?: Map<string, Server>
}

export type {
    Client,
    Command,
    Event
};
