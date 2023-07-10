class LogParser {
    uuid: string;

    constructor (uuid: string) {
        this.uuid = uuid;
    }

    get logPath (): string {
        return `/var/lib/pterodactyl/volumes/${this.uuid}/data/log.txt`;
    }
}

export default LogParser;
