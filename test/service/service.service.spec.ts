import {describe} from "mocha";
import {ServiceService} from "../../src/service/service.service";
import {expect} from "chai";
import {Service, ServiceType} from "../../src/service/service.interface";

const serviceService = new ServiceService();

describe("Service service tests", () => {

    it("should return test service", () => {
         return serviceService
             .getServices()
             .then(results => {
                 expect(results).to.length(1);

                 const service: Service = results[0];
                 expect(service.id).to.equal("123");
                 expect(service.image).to.equal("img");
                 expect(service.type).to.equal(ServiceType.Deployment);
                 expect(service.createdAt).to.not.be.empty;
                 expect(service.cpu).to.equal(1);
                 expect(service.memory).to.equal(512);
             });
    });

});
