import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config as dotenv } from 'dotenv';
import mongoose from 'mongoose';

import * as loader from './modules/loader';

import log from './utils/log';
import * as logExtra from './utils/logExtra';
import deployCommands from './utils/deployCommands';

import type { Client as DCClient } from './typings/discord';

dotenv();

const client: DCClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction
    ]
});

/**
 * Prevents crash on error.
 */
process.on(`uncaughtException`, err => log(`red`, err.stack ?? err.message));

/**
 * Start up the bot.
 */
const main = async (): Promise<void> => {
    // Clear console and log program headers.
    console.clear();
    logExtra.logSplash();

    if (process.env.MONGODB_URI !== undefined) {
        logExtra.logHeader();

        await mongoose.connect(process.env.MONGODB_URI);
        log(`green`, `Connected to database.`);
    }

    await loader.loadCommands(client);
    await loader.loadEvents(client);

    if (process.env.NODE_ENV === `development`) {
        logExtra.logHeader();
        await deployCommands(client);
    }

    logExtra.logHeader();
    await client.login(process.env.DISCORD_TOKEN).catch(() => log(`red`, `Failed to authenticate client with application.`));
};

// Start the program.
void main();

export default client;
