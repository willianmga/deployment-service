import mongoConnection from "./mongo";
import expressServer from "./express/express.server";
import configLoader from "./config/config.loader";

async function startServer() {
    configLoader.load();
    await mongoConnection.connect();
    await expressServer.start();
}

(startServer());


