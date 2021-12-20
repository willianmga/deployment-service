import express from "express";
import helmet from "helmet";
import {serviceRouter} from "./service/service.router";
import pinoHttp from "pino-http";
import {logger} from "./logger";

export class ExpressServer {

    static async start(): Promise<any> {

        const port = ExpressServer.getPort();
        const app = express();

        app.use(helmet());
        app.use(express.json());
        app.use(pinoHttp({logger}));
        app.use("/service", serviceRouter);

        return new Promise<any>(resolve => {
            const server = app.listen(port, () => {
                logger.info(`Server started on port ${port}`);
                resolve(server);
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
