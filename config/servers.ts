interface Server {
    uuid: string
    log?: {
        channel: string
        killfeed: boolean
    }
}

const servers: Record<string, Server> = {
    [`CO-UST`]: {
        uuid: `c87d300c-e132-4dcc-a04c-1966584e59c6`,
        log: {
            channel: `1128147906424225862`,
            killfeed: true
        }
    },
    [`CO-US01`]: {
        uuid: `d3bef952-a64c-45c4-8ec0-be4b6daf59fe`,
        log: {
            channel: `1128147917170020462`,
            killfeed: false
        }
    },
    [`CO-US02`]: {
        uuid: `beb15055-e853-4d1d-88a6-8fe027225184`,
        log: {
            channel: `1128147930503712848`,
            killfeed: false
        }
    },
    [`CO-US03`]: {
        uuid: `ae042024-a61b-41ea-903e-c997926b9ae2`,
        log: {
            channel: `1128147970823569508`,
            killfeed: false
        }
    }
};

export {
    type Server,
    servers
};
