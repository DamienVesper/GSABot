import { ActivityType } from 'discord.js';

import log from '../utils/log';

import type { Client } from '../typings/discord';

/**
 * Refresh the activity of the client.
 * @param client The Discord client to use.
 */
const refreshActivity = async (client: Client): Promise<void> => {
    client.user?.setPresence({
        activities: [{
            name: `Geneshift`,
            type: ActivityType.Playing
        }],

        status: `dnd`
    });

    log(`green`, `Status updated.`);
};

export default refreshActivity;
