import config from '../../config/config';

import log from '../utils/log';
import { logHeader } from '../utils/logExtra';
import refreshActivity from '../utils/refreshActivity';

import type { Client } from '../typings/discord';
import Server from '../modules/Server';

export default async (client: Client): Promise<void> => {
    log(`green`, `Client has started, with ${client.users.cache.size} user(s) in ${client.guilds.cache.size} guild(s).`);
    logHeader();

    // Create server map.
    client.servers = new Map();
    for (const server of Object.entries(config.servers)) client.servers.set(server[0], new Server(client, server[0], server[1]));

    await refreshActivity(client);

    setInterval(() => { void refreshActivity(client); }, config.cooldowns.utils.refreshActivity);
};
