interface Server {
    uuid: string
    log?: {
        channel: string
        killfeed: boolean
    }
}

const servers: Record<string, Server> = {
    [`CO-UST`]: { uuid: `c87d300c-e132-4dcc-a04c-1966584e59c6` },
    [`CO-US01`]: {
        uuid: `d3bef952-a64c-45c4-8ec0-be4b6daf59fe`,
        log: {
            channel: `644370385025892374`,
            killfeed: false
        }
    },
    [`CO-US02`]: { uuid: `beb15055-e853-4d1d-88a6-8fe027225184` },
    [`CO-US03`]: { uuid: `ae042024-a61b-41ea-903e-c997926b9ae2` }
};

export {
    type Server,
    servers
};
