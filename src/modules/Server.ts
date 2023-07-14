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
    ROUND_OVER: /\(\d+\): Sending Round Over/i,
    RESET_SERVER: /\(\d+\): (HostNewRound|Restarting Match|Queuing Restart Due to New Player)/i,

    // BR
    ROUND_STARTING: /\(\d+\): RestartBattleRound: : (\d+)/,
    ROUND_WON: /\(\d+\): SERVER: (.+) wins round (\d+)/,
    MATCH_WON: /\(\d+\): SERVER: (.+) gets the winner winner/
};

interface Player {
    kills: number
    deaths: number
}

enum ServerState {
    Initialized,
    Warmup,
    Round1,
    Round2,
    Round3,
    Finished
}

class Server {
    client: Client;
    config: ServerConfig;

    name: string;
    state: ServerState;

    channel: TextBasedChannel | undefined;

    winners: string[];
    topPlayers: Array<{ username: string, kdr: number }>;

    players: Map<string, Player>;
    users: Map<string, string>;

    logger: Tail;
    version: string | undefined;

    constructor (client: Client, name: string, config: ServerConfig) {
        this.client = client;
        this.config = config;

        this.name = name;
        this.state = ServerState.Initialized;

        this.winners = [];
        this.topPlayers = [];

        this.players = new Map();
        this.users = new Map();

        if (config !== undefined) {
            this.parseVersion();
            void this.initLogger();
        }
    }

    private readonly parseVersion = (): void => {
        const data = REGEX.START.exec(fs.readFileSync(this.logPath, `utf-8`));
        if (data === null) return;

        this.version = data[1].slice(1);
    };

    private readonly initLogger = async (): Promise<void> => {
        if (this.config.log?.channel === undefined) return;

        this.channel = await this.client.channels.fetch(this.config.log.channel) as TextBasedChannel;

        if (this.version !== undefined) {
            const sEmbed = new EmbedBuilder()
                .setColor(config.colors.blue)
                .setDescription(`Monitoring **${this.name}**, running **Gene Shift Auto v${this.version}**.`)
                .setTimestamp()
                .setFooter({ text: this.footer });

            await this.channel.send({ embeds: [sEmbed] });
        }

        this.logger = new Tail(this.logPath);

        this.logger.on(`line`, (data: string) => {
            if (this.channel === undefined) return;

            if (REGEX.START.test(data) && this.version !== undefined) {
                const res = REGEX.START.exec(data);
                if (res === null) return;

                this.version = res[1].slice(1);
            } else if (REGEX.JOIN.test(data)) {
                const res = REGEX.JOIN.exec(data);
                if (res === null) return;

                const username = res[1];
                const steamID = res[2];

                this.users.set(username, steamID);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.green)
                    .setDescription(`:arrow_right: **${username}** has joined the server.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: this.footer });

                void this.channel.send({ embeds: [sEmbed] });
            } else if (REGEX.LEAVE.test(data)) {
                const res = REGEX.LEAVE.exec(data);
                if (res === null) return;

                const username = res[1];
                this.users.delete(username);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.red)
                    .setDescription(`:arrow_left: **${username}** has left the server.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: this.footer });

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

                const perpetratorIsBot = config.bots.includes(perpetrator.toLowerCase());
                const victimIsBot = config.bots.includes(victim.toLowerCase());

                if (perpetratorIsBot && victimIsBot) return;

                const A = perpetratorIsBot ? `[B] ${perpetrator}` : perpetrator;
                const B = victimIsBot ? `[B] ${victim}` : victim;

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.orange)
                    .setDescription(`:skull_crossbones: **${A}** killed **${B}** with ${article(weapon)} ${weapon}.`)
                    .setTimestamp(new Date())
                    .setFooter({ text: this.footer });

                void this.channel.send({ embeds: [sEmbed] });
            } else if (
                (REGEX.ROUND_OVER.test(data) && this.state === ServerState.Finished) ||
                REGEX.RESET_SERVER.test(data)
            ) this.reset();
            else if (REGEX.ROUND_STARTING.test(data)) {
                const res = REGEX.ROUND_STARTING.exec(data);
                if (res === null) return;

                const round = res[1];
                switch (round) {
                    case `0`: this.state = ServerState.Warmup; break;
                    case `1`: this.state = ServerState.Round1; break;
                    case `2`: this.state = ServerState.Round2; break;
                    case `3`: this.state = ServerState.Round3; break;
                }

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.blue)
                    .setDescription(`:exclamation: ${round === `0` ? `The warmup round` : `Round ${round}`} is starting!`)
                    .setTimestamp(new Date())
                    .setFooter({ text: this.footer });

                void this.channel.send({ embeds: [sEmbed] });
            } else if (REGEX.ROUND_WON.test(data) && this.state !== ServerState.Initialized) {
                const res = REGEX.ROUND_WON.exec(data);
                if (res === null) return;

                const winner = res[1];
                const round = res[2];

                const isBot = config.bots.includes(winner.toLowerCase());
                this.winners.push(isBot ? `[B] ${winner}` : winner);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.purple)
                    .setDescription(`${isBot ? `:robot:` : `:adult:`} **${winner}**${isBot ? `, a bot,` : ``} won round ${round}!`)
                    .setTimestamp(new Date())
                    .setFooter({ text: this.footer });

                void this.channel.send({ embeds: [sEmbed] });
                this.state = ServerState.Initialized;
            } else if (REGEX.MATCH_WON.test(data)) {
                const res = REGEX.MATCH_WON.exec(data);
                if (res === null) return;

                this.state = ServerState.Finished;

                const matchWinner = res[1];
                const isBot = config.bots.includes(matchWinner.toLowerCase());

                const lb = [...this.players.entries()].sort(([a, x], [b, y]) => (x.kills / x.deaths) - (y.kills / y.deaths)).slice(0, 5);

                const sEmbed = new EmbedBuilder()
                    .setColor(config.colors.teal)
                    .setDescription(`${isBot ? `:person_facepalming: A bot, **[B] ${matchWinner}**,` : `:trophy: **${matchWinner}**`} won the final round!`)
                    .setFields([
                        {
                            name: `Round Winners`,
                            value: this.winners.length !== 0
                                ? this.winners.map((x, i) => `Round ${i} - ${x}`).join(`\n`)
                                : `Error loading winners (bot was restarted).`
                        },
                        {
                            name: `Top KDR`,
                            value: lb.length !== 0
                                ? lb.map(([username, data]) => `**${username}** - ${data.kills}/${data.deaths} (${(data.kills / data.deaths).toFixed(2)})`).join(`\n`)
                                : `Error loading leaderboard (bot was restarted).`
                        }
                    ])
                    .setTimestamp(new Date())
                    .setFooter({ text: this.footer });

                void this.channel.send({ embeds: [sEmbed] });
                this.reset(true);
            }
        });

        this.logger.on(`error`, err => {
            log(`red`, err);
        });

        log(`green`, `Initiated logging for ${this.name} [${this.config.uuid}].`);
    };

    private readonly reset = (force?: boolean): void => {
        if (force === true) {
            this.players.clear();
            this.users.clear();

            this.winners = [];
        }

        this.state = ServerState.Initialized;
    };

    get logPath (): string {
        return `/var/lib/pterodactyl/volumes/${this.config.uuid}/data/log.txt`;
    }

    get footer (): string {
        return this.version !== undefined
            ? `${this.name} | Gene Shift Auto v${this.version}`
            : this.name;
    }
}

export default Server;
