import { version } from '../package.json';

import channels from './channels';
import colors from './colors';
import cooldowns from './cooldowns';
import { emojis, emojiIDs } from './emojis';
import help from './help';
import httpCodes from './httpCodes';
import roles from './roles';
import { servers } from './servers';

import * as path from 'path';
import * as fs from 'fs';

import * as dotenv from 'dotenv';
dotenv.config();

const config = {
    developerID: `386940319666667521`,

    channels,
    colors,
    cooldowns,
    emojis,
    emojiIDs,
    help,
    httpCodes,
    roles,
    servers,

    bots: fs.readFileSync(path.resolve(__dirname, `./bots.txt`), `utf-8`).split(`\n`).filter(x => !x.startsWith(`/*`) && x !== ``),

    version,
    footer: `GeneshiftBot | v${version}`
};

export default config;
