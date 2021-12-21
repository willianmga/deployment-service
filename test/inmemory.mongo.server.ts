import {MongoMemoryServer} from "mongodb-memory-server";
import {logger} from "../src/logger";
import mongoConnection from "../src/mongo";

class InMemoryMongoServer {

    private mongoMemoryServer: MongoMemoryServer;

    async start() {
        try {
            this.mongoMemoryServer = await MongoMemoryServer.create();
            process.env.MONGO_URI = this.mongoMemoryServer.getUri();
            process.env.MONGO_DATABASE = "deployment-service";
            logger.info("Started in memory mongodb instance");
        } catch (error) {
            logger.fatal(`Couldn't start in memory mongodb instance. Reason: ${error}. Exiting application`);
            process.exit(1);
        }
    }

    async connect() {
        if (!this.mongoMemoryServer) {
            await this.start()
        }
        await mongoConnection.connect();
    }

    async cleanUp() {
        await this.mongoMemoryServer.cleanup(true);
    }

    async stop() {
        if (this.mongoMemoryServer) {
            await this.mongoMemoryServer.stop();
            logger.info("stopped in memory mongodb instance");
        }
    }

}

const inMemoryMongoServer: InMemoryMongoServer = new InMemoryMongoServer();

export default inMemoryMongoServer;
