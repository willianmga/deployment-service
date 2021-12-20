import {Db, MongoClient} from "mongodb";
import {MongoMemoryServer} from "mongodb-memory-server";
import {logger} from "./logger";

class MongoConnection {

    private database: Db;
    private mongoClient: MongoClient;
    private inMemoryServer: MongoMemoryServer;

    async connect() {

        let mongoUri: string = process.env.MONGO_URI;

        if (process.env.NODE_ENV === "development") {
            try {
                this.inMemoryServer = await MongoMemoryServer.create();
                mongoUri = this.inMemoryServer.getUri();
                logger.info("Started in memory mongodb instance");
            } catch (error) {
                logger.fatal(`Couldn't start in memory mongodb instance. Reason: ${error}. Exiting application`);
                process.exit(1);
            }
        }

        if (!mongoUri) {
            logger.fatal("Couldn't find mongo connection parameters. Exiting application");
            process.exit(1);
        }

        try {
            this.mongoClient = new MongoClient(mongoUri);
            await this.mongoClient.connect();
            this.database = this.mongoClient.db("deployment-service");
            logger.info(`Connected to mongodb`);
        } catch (error) {
            logger.fatal("Couldn't connect to mongo using provided MONGO_URI. Exiting application");
            process.exit(1);
        }
    }

    async closeConnection() {
        if (this.mongoClient) {
            await this.mongoClient.close();
        }
        if (this.inMemoryServer) {
            await this.inMemoryServer.stop();
        }
    }

    getDatabase(): Db {
        return this.database;
    }

}

const mongoConnection: MongoConnection = new MongoConnection();

export default mongoConnection;
