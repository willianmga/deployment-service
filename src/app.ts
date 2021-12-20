import * as dotenv from "dotenv";
import mongoConnection from "./mongo";
import {ExpressServer} from "./express";

async function startServer() {
    dotenv.config();
    await mongoConnection.connect();
    ExpressServer.start();
}

(startServer());

