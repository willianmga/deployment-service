import {MongoMemoryServer} from "mongodb-memory-server";
import {logger} from "../src/logger";
import mongoConnection from "../src/mongo";
import {Db, MongoClient} from "mongodb";
import {ApiMongoCollections} from "../src/mongo/mongo.collections.enum";
import {UserMongo, UserRole, UserStatus} from "../src/user/user.interfaces";
import {HashService} from "../src/session/hash.service";

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
            await mongoConnection.connect();
        } else {
            logger.error("In memory mongodb instance is already running");
        }
    }

    async cleanUp() {
        try {
            Object
                .values(ApiMongoCollections)
                .forEach(async (collectionName) => {
                    await this.mongoDatabase.dropCollection(collectionName);
                });
        } catch (error) {
            logger.fatal("Failed to clean up mongodb state.");
        }
    }

    async stop() {
        if (this.mongoMemoryServer) {
            await this.mongoClient.close();
            await this.mongoMemoryServer.stop();
            this.mongoMemoryServer = undefined;
            logger.info("stopped in memory mongodb instance");
        }
    }

    async loadData() {
        await this.loadUsersData();
    }

    async loadUsersData() {

        const hashService: HashService = new HashService();

        const userAdmin: UserMongo = {
            _id: "e1fced1f-44a6-4de1-aa85-e6e4ebb88db0",
            username: "admin",
            password: hashService.hash("strongpassword"),
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        };

        const userContributor: UserMongo = {
            _id: "30c3801a-191a-4059-89be-336d1bec35a9",
            username: "contributor",
            password: hashService.hash("evenstrongerpassword"),
            role: UserRole.CONTRIBUTOR,
            status: UserStatus.ACTIVE
        };

        const userGuest: UserMongo = {
            _id: "60cc8222-24f0-40e0-8ff2-1c5b259cfa7c",
            username: "guest",
            password: hashService.hash("password"),
            role: UserRole.GUEST,
            status: UserStatus.ACTIVE
        };

        const users: Array<UserMongo> = [userAdmin, userContributor, userGuest];
        await this.mongoDatabase.collection<UserMongo>(ApiMongoCollections.USERS).insertMany(users);
    }

}

const inMemoryMongoServer: InMemoryMongoServer = new InMemoryMongoServer();

export default inMemoryMongoServer;
