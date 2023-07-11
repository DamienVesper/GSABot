import config from '../../config/config';
import type { Server as ServerConfig } from '../../config/servers';

import { type TextBasedChannel } from 'discord.js';
import { EmbedBuilder } from '@discordjs/builders';

import { Tail } from 'tail';
import * as fs from 'fs';

import log from '../utils/log';

import type { Client } from '../typings/discord';
import { article } from '../utils/standardize';

/**
 * https://github.com/LouisT/GSAFeed/blob/main/parsers.go
 * Thanks to @LouisT for saving hours of debugging, and my sanity.
 */
const REGEX = {
    // Universal
    START: /\(\d+\): ========= Start Loading Gene Shift Auto (.[^\s]+)/,

    JOIN: /\(\d+\): (.+) joined with steamID: (\d+)/,
    LEAVE: /\(\d+\): Saving: (.+)/,
    KILL: /\(\d+\): (.+) killed (.+) with (.+)/,
    ROUND_OVER: /(?i)\(\d+\): Sending Round Over/,
    RESET_SERVER: /(?i)\(\d+\): (HostNewRound|Restarting Match|Queuing Restart Due to New Player)/,

    // BR
    ROUND_WON: /\(\d+\): SERVER: (.+) wins round (\d+)/,
    MATCH_WON: /`\(\d+\): SERVER: (.+) gets the winner winner/,
    ROUND_STARTING: /\(\d+\): RestartBattleRound: : (\d+)/
};

interface Player {
    kills: number
    deaths: number
}

class Server {
    client: Client;
    config: ServerConfig;

    name: string;

    channel: TextBasedChannel | undefined;

    winners: string[];
    topPlayers: Array<{ username: string, kdr: number }>;

    players: Map<string, Player>;
    users: Set<string>;

    logger: Tail;
    version: string | undefined;

    constructor (client: Client, name: string, config: ServerConfig) {
        this.client = client;
        this.config = config;

        this.name = name;

        this.winners = [];
        this.topPlayers = [];

        this.players = new Map();
        this.users = new Set();

        if (config !== undefined) {
            this.parseVersion();
            void this.initLogger();
        }
    }

    private readonly parseVersion = (): void => {
        const data = fs.readFileSync(this.logPath, `utf-8`);
        console.log(REGEX.START.exec(data));
    };

    private readonly initLogger = async (): Promise<void> => {
        if (this.config.log?.channel === undefined) return;

        this.channel = await this.client.channels.fetch(this.config.log.channel) as TextBasedChannel;

        if (this.version !== undefined) {
            const sEmbed = new EmbedBuilder()
                .setColor(config.colors.blue)
                .setDescription(`Connected to **${this.name}**, running GeneShiftAuto v${this.version}`)
                .setTimestamp();

            await this.channel.send({ embeds: [sEmbed] });
        }

        this.logger = new Tail(this.logPath);

        this.logger.on(`line`, (data: string) => {
            if (this.channel === undefined) return;

            if (REGEX.JOIN.test(data)) {
                const res = REGEX.JOIN.exec(data);
                if (res === null) return;

                const username = res[1];

                if (this.users.has(username)) return;
                this.users.add(username);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.green)
                    .setDescription(`:arrow_right: **${username}** has joined the server.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: config.footer });

                void this.channel.send({ embeds: [sEmbed] });
            } else if (REGEX.LEAVE.test(data)) {
                const res = REGEX.LEAVE.exec(data);
                if (res === null) return;

                const username = res[1];

                if (!this.players.has(username)) return;
                this.players.delete(username);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.red)
                    .setDescription(`:arrow_left: **${username}** has left the server.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: config.footer });

                void this.channel.send({ embeds: [sEmbed] });
            } else if (this.config.log?.killfeed === true && REGEX.KILL.test(data)) {
                const res = REGEX.KILL.exec(data);
                if (res === null) return;

                const perpetrator = res[1];
                const victim = res[2];
                const weapon = res[3];

                const perpetratorStats = this.players.get(perpetrator);
                const victimStats = this.players.get(victim);

                if (perpetratorStats === undefined) this.players.set(perpetrator, { kills: 1, deaths: 0 });
                else perpetratorStats.kills++;

                if (victimStats === undefined) this.players.set(victim, { kills: 0, deaths: 1 });
                else victimStats.deaths++;

                const perpetratorIsBot = this.users.has(perpetrator);
                const victimIsBot = this.users.has(victim);

                const A = perpetratorIsBot ? `[B] ${perpetrator}` : perpetrator;
                const B = victimIsBot ? `[B] ${victim}` : victim;

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.orange)
                    .setDescription(`:skull_crossbones: **${A}** killed **${B}** with ${article(weapon)} ${weapon}.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: config.footer });

                void this.channel.send({ embeds: [sEmbed] });
            }
        });

        this.logger.on(`error`, err => {
            log(`red`, err);
        });

        log(`green`, `Initiated logging for ${this.name} [${this.config.uuid}].`);
    };

    get logPath (): string {
        return `/var/lib/pterodactyl/volumes/${this.config.uuid}/data/log.txt`;
    }
}

export default Server;
