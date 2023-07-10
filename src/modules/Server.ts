import config from '../../config/config';
import type { Server as ServerConfig } from '../../config/servers';

import type { TextBasedChannel } from 'discord.js';
import { Tail } from 'tail';

import log from '../utils/log';

import type { Client } from '../typings/discord';
import { EmbedBuilder } from '@discordjs/builders';

class Server {
    client: Client;
    config: ServerConfig;

    name: string;

    channel: TextBasedChannel | undefined;

    winners: string[];
    topPlayers: Array<{ username: string, kdr: number }>;

    players: Set<string>;

    logger: Tail;

    constructor (client: Client, name: string, config: ServerConfig) {
        this.client = client;
        this.config = config;

        this.name = name;

        this.winners = [];
        this.topPlayers = [];

        this.players = new Set();

        if (config !== undefined) void this.initLogger();
    }

    private readonly initLogger = async (): Promise<void> => {
        if (this.config.log?.channel === undefined) return;

        this.channel = await this.client.channels.fetch(this.config.log.channel) as TextBasedChannel;
        this.logger = new Tail(this.logPath);

        this.logger.on(`line`, (data: string) => {
            if (this.channel === undefined) return;

            if ((/joined with steamID/g).test(data)) {
                const words = data.split(` `);
                const username = words[0];
                // const steamID = words[4];

                if (this.players.has(username)) return;
                this.players.add(username);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.red)
                    .setDescription(`:arrow_right: **${username}** has joined the server.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: config.footer });

                void this.channel.send({ embeds: [sEmbed] });
            } else console.log(data);
        });

        this.logger.on(`error`, err => {
            log(`red`, err);
        });

        log(`green`, `Initiated logging for ${this.name} [${this.config.uuid}]`);
    };

    get logPath (): string {
        return `/var/lib/pterodactyl/volumes/${this.config.uuid}/data/log.txt`;
    }
}

export default Server;
