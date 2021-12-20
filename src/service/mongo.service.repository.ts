import {Service, ServiceMongo} from "./service.interface";
import mongoConnection from "../mongo";
import {Collection, InsertOneResult, WithId} from "mongodb";

export class MongoServiceRepository {

    async insertService(service: Service): Promise<string> {
        return new Promise<string>((resolve, reject) => {

            const serviceMongo: ServiceMongo = {
                _id: service.id,
                image: service.image,
                type: service.type,
                createdAt: service.createdAt,
                cpu: service.cpu,
                memory: service.memory
            }

            this
                .getCollection()
                .insertOne(serviceMongo)
                .then((result: InsertOneResult<ServiceMongo>) => resolve(result.insertedId.toString()))
                .catch(error => reject(error))
        });
    };

    async getServices(): Promise<Service[]> {
        return new Promise<Service[]>((resolve, reject) => {
            return this.getCollection()
                .find()
                .toArray()
                .then((results: WithId<ServiceMongo>[]) => resolve(this.mapToServicesArray(results)))
                .catch(error => reject(error))
        });
    };

    private mapToServicesArray(results: WithId<ServiceMongo>[]): Service[] {
        return results
            .map(serviceMongo => {
                return {
                    id: serviceMongo._id,
                    image: serviceMongo.image,
                    type: serviceMongo.type,
                    createdAt: serviceMongo.createdAt,
                    cpu: serviceMongo.cpu,
                    memory: serviceMongo.memory
                }
            });
    }

    private getCollection(): Collection<ServiceMongo> {
        return  mongoConnection
            .getDatabase()
            .collection("services");
    }

}
