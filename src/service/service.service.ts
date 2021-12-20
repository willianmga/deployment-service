import {Service} from "./service.interface";
import {MongoServiceRepository} from "./mongo.service.repository";

export class ServiceService {

    serviceMongo: MongoServiceRepository;

    constructor() {
        this.serviceMongo = new MongoServiceRepository();
    }

    async insertService(service: Service): Promise<string> {
        return this.serviceMongo.insertService(service);
    };

    async getServices(): Promise<Service[]> {
        return this.serviceMongo.getServices();
    };

}
