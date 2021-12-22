import mongoConnection from "../mongo";
import {ApiMongoCollections} from "../mongo/mongo.collections.enum";
import {Collection, InsertOneResult} from "mongodb";
import {ApiErrorType} from "../service/error.interface";
import {logger} from "../logger";
import {Session, SessionMongo} from "./session.interfaces";

export class MongoSessionRepository {

    async insertSession(session: Session): Promise<Session> {
        return new Promise<Session>((resolve, reject) => {
            this.getCollection()
                .insertOne(this.mapToSessionMongo(session))
                .then((result: InsertOneResult<SessionMongo>) => {
                    if (!result.acknowledged) {
                        throw new Error("Session not inserted");
                    }

                    resolve(session);
                })
                .catch(error => {
                    logger.error(`Failed to insert session. Error: ${error}`);
                    reject(ApiErrorType.DB_ERROR);
                });
        });
    }

    private mapToSessionMongo(session: Session): SessionMongo {
        return {
            _id: session.id,
            userId: session.userId,
            status: session.status,
            createdDate: session.createdDate,
            expirationDate: session.expirationDate
        };
    }

    private getCollection(): Collection<SessionMongo> {
        return mongoConnection
            .getDatabase()
            .collection<SessionMongo>(ApiMongoCollections.SESSIONS);
    }

}
