import md5 from "md5";
import {DeploymentLibrary} from "lc-interviews";
import {Service} from "./service.interface";
import {MongoServiceRepository} from "./mongo.service.repository";
import {logger} from "../logger";
import {ApiErrorType} from "./error.interface";

export class ServiceService {

    serviceMongo: MongoServiceRepository;

    constructor() {
        this.serviceMongo = new MongoServiceRepository();
    }

    createService(service: Service): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.serviceMongo
                .idInUse(service.id)
                .then(idInUse => {
                    if (!idInUse) {
                        service.createdAt = Date.now().toString();
                        return this.serviceMongo.insertService(service);
                    } else {
                        reject(ApiErrorType.ID_IN_USE);
                    }
                })
                .then(serviceId => resolve(serviceId))
                .catch(error => reject(error));
        });
    };

    deployService(id: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.getServiceById(id)
                .then(service => {

                    this.startServiceDeployment(service)
                        .then(() => logger.info(`Service with id ${md5(service.id)} deployed successfully.`))
                        .catch(error => logger.error(`Failed to deploy service. Reason ${error}`));

                    resolve({status: "Deployment scheduled"});
                })
                .catch(error => reject(error));
        });
    };

    getServices(sort: any): Promise<Service[]> {
        return this.serviceMongo.getServices(sort);
    };

    getServiceById(id: string): Promise<Service> {
        return new Promise<Service>((resolve, reject) => {
            const deploymentStatus = DeploymentLibrary.getDeploymentStatus(id);
            this.serviceMongo.getServiceById(id)
                .then(service => {
                    service.deploymentStatus = deploymentStatus;
                    resolve(service);
                })
                .catch(error => reject(error))
        });
    }

    private async startServiceDeployment(service: Service) {
        logger.info(`Starting deployment of service with id ${md5(service.id)}.`);
        DeploymentLibrary.deploy({id: service.id, image: service.image});
    }

}
