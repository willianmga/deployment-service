import md5 from "md5";
import {DeploymentLibrary} from "lc-interviews";
import {Service} from "./service.interface";
import {MongoServiceRepository} from "./mongo.service.repository";
import {logger} from "../logger";

export class ServiceService {

    serviceMongo: MongoServiceRepository;

    constructor() {
        this.serviceMongo = new MongoServiceRepository();
    }

    createService(service: Service): Promise<string> {
        return this.serviceMongo.insertService(service);
    };

    deployService(id: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.getServiceById(id)
                .then(service => {
                    this.startServiceDeployment(service)
                        .then(() => logger.info(`Service with id ${md5(service.id)} deployed successfully.`));
                    resolve({status: "Deployment scheduled"});
                })
                .catch(error => reject(error));
        });
    };

    getServices(): Promise<Array<Service>> {
        return this.serviceMongo.getServices();
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
