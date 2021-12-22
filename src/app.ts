import * as dotenv from "dotenv";
import mongoConnection from "./mongo";
import expressServer from "./express/express.server";

async function startServer() {
    dotenv.config();
    await mongoConnection.connect();
    await expressServer.start();
}

(startServer());

