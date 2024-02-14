interface Server {
    uuid: string
    log?: {
        channel: string
        killfeed: boolean
    }
}

const servers: Record<string, Server> = {
    [`Banabyte | Micro Royale`]: {
        uuid: `571cee3c-67f0-4d93-9a67-8ab13682c7df`,
        log: {
            channel: `1128147906424225862`,
            killfeed: true
        }
    },
    [`Banabyte | Micro TDM`]: {
        uuid: `249976ba-eda4-4a1a-928b-97c911177edf`,
        log: {
            channel: `1128147917170020462`,
            killfeed: false
        }
    }
};

export {
    type Server,
    servers
};
