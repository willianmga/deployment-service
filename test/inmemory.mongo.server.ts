import {MongoMemoryServer} from "mongodb-memory-server";
import {logger} from "../src/logger";
import mongoConnection from "../src/mongo";
import {Db, MongoClient} from "mongodb";
import {ApiMongoCollections} from "../src/mongo/mongo.collections.enum";

class InMemoryMongoServer {

    private mongoMemoryServer: MongoMemoryServer;
    private mongoClient: MongoClient;
    private mongoDatabase: Db;

    async start() {
        try {
            this.mongoMemoryServer = await MongoMemoryServer.create();
            process.env.MONGO_URI = this.mongoMemoryServer.getUri();
            process.env.MONGO_DATABASE = "deployment-service";

            this.mongoClient = new MongoClient(process.env.MONGO_URI);
            await this.mongoClient.connect();
            this.mongoDatabase = this.mongoClient.db(process.env.MONGO_DATABASE);

            logger.info("Started and connected to in memory mongodb instance");
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
        try {
            Object
                .values(ApiMongoCollections)
                .forEach(collectionName => this.mongoDatabase.dropCollection(collectionName));
        } catch (error) {
            logger.fatal("Failed to clean up mongodb state.");
        }
    }

    async stop() {
        if (this.mongoMemoryServer) {
            await this.mongoClient.close();
            await this.mongoMemoryServer.stop();
            logger.info("stopped in memory mongodb instance");
        }
    }

}

const inMemoryMongoServer: InMemoryMongoServer = new InMemoryMongoServer();

export default inMemoryMongoServer;
