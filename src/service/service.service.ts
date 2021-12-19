import {Service, ServiceType} from "./service.interface";

export class ServiceService {

    async getServices(): Promise<Array<Service>> {
        return new Promise<Array<Service>>(resolve => {

            const serviceExample: Array<Service> = [{
                id: "123",
                image: "img",
                type: ServiceType.Deployment,
                createdAt: Date.now().toString(),
                cpu: 1,
                memory: 512
            }];

            resolve(serviceExample);
        });
    };

}
