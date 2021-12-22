import mongoConnection from "../mongo";
import {User, UserMongo} from "./user.interfaces";
import {ApiMongoCollections} from "../mongo/mongo.collections.enum";
import {Collection, WithId} from "mongodb";
import {ApiErrorType} from "../service/error.interface";
import {logger} from "../logger";

export class MongoUserRepository {

    async findUser(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            this.getCollection()
                .findOne({username})
                .then(userMongo => {
                    if (!userMongo) {
                        return reject(ApiErrorType.NOT_FOUND);
                    }
                    resolve(this.mapToUser(userMongo));
                })
                .catch(error => {
                    logger.error(`Failed to find user. Error: ${error}`)
                    reject(ApiErrorType.DB_ERROR)
                })
        });
    }

    private mapToUser(userMongo: WithId<UserMongo>): User {
        return {
            id: userMongo._id,
            username: userMongo.username,
            password: userMongo.password,
            role: userMongo.role,
            status: userMongo.status
        }
    }

    private getCollection(): Collection<UserMongo> {
        return mongoConnection
            .getDatabase()
            .collection<UserMongo>(ApiMongoCollections.USERS);
    }

}
