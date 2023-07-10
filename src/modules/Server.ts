import { Tail } from 'tail';

import log from '../utils/log';

class Server {
    uuid: string;
    logChannel: string | undefined;

    winners: string[];
    topPlayers: Array<{ username: string, kdr: number }>;

    logger: Tail;

    constructor (uuid: string, logChannel?: string) {
        this.uuid = uuid;
        this.logChannel = logChannel;

        this.winners = [];
        this.topPlayers = [];

        if (this.logChannel !== undefined) this.initLogger();
    }

    private readonly initLogger = (): void => {
        this.logger = new Tail(this.logPath);

        this.logger.on(`line`, (data: string) => {
            console.log(data);
        });

        this.logger.on(`error`, err => {
            log(`red`, err);
        });
    };

    get logPath (): string {
        return `/var/lib/pterodactyl/volumes/${this.uuid}/data/log.txt`;
    }
}

export default Server;
