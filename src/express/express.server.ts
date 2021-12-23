import express from "express";
import helmet from "helmet";
import {serviceRouter} from "../service/service.router";
import {sessionRouter} from "../session/session.router";
import pinoHttp from "pino-http";
import {logger} from "../logger";
import http from "http";
import {jwtTokenValidationMiddleware} from "./authentication.middleware";
import {healthCheckRouter} from "../healthcheck/health.check.router";

class ExpressServer {

    private expressApp: http.Server;

    async start() {

        const port = ExpressServer.getPort();
        const app = express();

        app.use(helmet());
        app.use(express.json());
        app.use(pinoHttp({logger}));
        app.use(jwtTokenValidationMiddleware);
        app.use("/v1/services", serviceRouter);
        app.use("/v1/sessions", sessionRouter);
        app.use("/v1/healthcheck", healthCheckRouter);

        this.expressApp = app.listen(port, () => {
            logger.info(`Server started on port ${port}`);
        });

    }

    async stop(): Promise<void> {
        return new Promise<void>(resolve => {
            this.expressApp.close(() => {
                logger.info("Server stopped");
                resolve();
                this.expressApp = undefined;
            });
        })
    }

    private static getPort(): number {
        try {
            return parseInt(process.env.SERVER_PORT as string, 10) || 8080;
        } catch (error) {
            return 8080;
        }
    }

}

const expressServer: ExpressServer = new ExpressServer();

export default expressServer;
