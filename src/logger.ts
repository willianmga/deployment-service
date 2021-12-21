import pino from "pino";

export const logger = pino({
    name: 'deployment-service',
    level: 'debug'
});
