import mongoConnection from "../mongo";
import {ApiMongoCollections} from "../mongo/mongo.collections.enum";
import {Collection, InsertOneResult, UpdateResult} from "mongodb";
import {ApiErrorType} from "../service/error.interface";
import {logger} from "../logger";
import {Session, SessionMongo, SessionStatus} from "./session.interfaces";

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

    async invalidateSession(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getCollection()
                .updateOne({_id: id}, {$set: {status: SessionStatus.LOGGED_OFF}})
                .then((result: UpdateResult) => {
                    if (!result.acknowledged || result.modifiedCount === 0) {
                        throw new Error("Session not invalidated");
                    }
                    resolve();
                })
                .catch(error => {
                    logger.error(`Failed to invalidate session. Error: ${error}`);
                    reject(ApiErrorType.DB_ERROR);
                });
        });
    }

    async findActiveSessionById(id: string): Promise<Session> {
        return new Promise<Session>((resolve, reject) => {
            this.getCollection()
                .findOne({_id: id, status: SessionStatus.ACTIVE})
                .then(sessionMongo => {
                    if (!sessionMongo) {
                        return reject(ApiErrorType.NOT_FOUND);
                    }
                    resolve(this.mapToSession(sessionMongo));
                })
                .catch(error => {
                    logger.error(`Failed to find session. Error: ${error}`)
                    reject(ApiErrorType.DB_ERROR)
                });
        });
    }

    private mapToSession(session: SessionMongo): Session {
        return {
            id: session._id,
            userId: session.userId,
            status: session.status,
            createdDate: session.createdDate,
            expirationDate: session.expirationDate
        };
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
