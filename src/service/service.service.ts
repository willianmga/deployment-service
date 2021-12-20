import {Service, ServiceType} from "./service.interface";

export class ServiceService {

    async getServices(): Promise<Service[]> {
        return new Promise<Service[]>(resolve => {

            const serviceExample: Service[] = [{
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
