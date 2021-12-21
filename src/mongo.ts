import {Db, MongoClient} from "mongodb";
import {logger} from "./logger";

class MongoConnection {

    private database: Db;
    private mongoClient: MongoClient;

    async connect() {

        const MONGO_URI: string = process.env.MONGO_URI;
        const MONGO_DATABASE: string = process.env.MONGO_DATABASE;

        if (!MONGO_DATABASE || !MONGO_DATABASE) {
            logger.fatal("Couldn't find mongo connection parameters. Exiting application");
            process.exit(1);
        }

        try {
            this.mongoClient = new MongoClient(MONGO_URI);
            await this.mongoClient.connect();
            this.database = this.mongoClient.db(MONGO_DATABASE);
            logger.info("Connected to mongodb database");
        } catch (error) {
            logger.fatal("Couldn't connect to mongo using provided MONGO_URI. Exiting application");
            process.exit(1);
        }
    }

    async closeConnection() {
        if (this.mongoClient) {
            await this.mongoClient.close();
            this.mongoClient = undefined;
            this.database = undefined;
            logger.info("Disconnected from mongodb database")
        }
    }

    getDatabase(): Db {
        return this.database;
    }

}

const mongoConnection: MongoConnection = new MongoConnection();

export default mongoConnection;
