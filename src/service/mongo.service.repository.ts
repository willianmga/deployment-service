import {Service, ServiceMongo} from "./service.interface";
import mongoConnection from "../mongo";
import {Collection, InsertOneResult, WithId} from "mongodb";
import {ApiErrorType} from "./error.interface";
import {logger} from "../logger";

export class MongoServiceRepository {

    async insertService(service: Service): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this
                .getCollection()
                .insertOne(this.mapToServiceMongo(service))
                .then((result: InsertOneResult<ServiceMongo>) => resolve(result.insertedId.toString()))
                .catch((error) => {
                    logger.error(`Failed to create service on mongodb. Error: ${error}`)
                    reject(ApiErrorType.DB_ERROR)
                })
        });
    };

    async getServices(): Promise<Array<Service>> {
        return new Promise<Array<Service>>((resolve, reject) => {
            return this.getCollection()
                .find()
                .toArray()
                .then((results: WithId<ServiceMongo>[]) => resolve(this.mapToServicesArray(results)))
                .catch((error) => {
                    logger.error(`Failed retrieve services from mongodb. Error: ${error}`)
                    reject(ApiErrorType.DB_ERROR)
                })
        });
    };

    async getServiceById(id: string): Promise<Service> {
        return new Promise<Service>((resolve, reject) => {
            return this.getCollection()
                .findOne<ServiceMongo>({_id: id})
                .then(serviceMongo => {
                    if (serviceMongo) {
                        resolve(this.mapToService(serviceMongo))
                    }
                    reject(ApiErrorType.NOT_FOUND);
                })
                .catch((error) => {
                    logger.error(`Failed to retrieve by id from mongodb. Error: ${error}`)
                    reject(ApiErrorType.DB_ERROR)
                })
        });
    };

    private mapToServicesArray(results: WithId<ServiceMongo>[]): Service[] {
        return results.map(serviceMongo => this.mapToService(serviceMongo));
    }

    private mapToService(serviceMongo: WithId<ServiceMongo>): Service {
        return {
            id: serviceMongo._id,
            image: serviceMongo.image,
            type: serviceMongo.type,
            createdAt: serviceMongo.createdAt,
            cpu: serviceMongo.cpu,
            memory: serviceMongo.memory
        }
    }

    private mapToServiceMongo(service: Service): ServiceMongo {
        return {
            _id: service.id,
            image: service.image,
            type: service.type,
            createdAt: service.createdAt,
            cpu: service.cpu,
            memory: service.memory
        }
    }

    private getCollection(): Collection<ServiceMongo> {
        return  mongoConnection
            .getDatabase()
            .collection("services");
    }

}
