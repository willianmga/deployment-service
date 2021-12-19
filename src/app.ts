import express from "express";
import * as dotenv from "dotenv";
import helmet from "helmet";
import {serviceRouter} from "./service/service.router";

dotenv.config();

if (!process.env.SERVER_PORT) {
    process.exit(1);
}

const PORT: number = parseInt(process.env.SERVER_PORT as string, 10);
const app = express();

app.use(helmet());
app.use(express.json());
app.use("/service", serviceRouter);

app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server started on port ${PORT}`);
});
