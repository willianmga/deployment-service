import {Service, ServiceType} from "../../src/service/service.interface";

export class ServiceRouterTestData {

    static createNewService(id: string): Service {
        return {
            id: id,
            image: "liferay/portal@latest",
            createdAt: "123",
            type: ServiceType.Deployment,
            cpu: 1,
            memory: 1024
        }
    }

}


