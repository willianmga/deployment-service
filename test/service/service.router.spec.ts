import {describe} from "mocha";
import {expect} from "chai";
import request from "supertest";
import {v4 as uuid} from "uuid";
import expressServer from "../../src/express/express.server";
import inMemoryMongoServer from "../inmemory.mongo.server";
import mongoConnection from "../../src/mongo";
import {DeploymentStatus, Service, ServiceType} from "../../src/service/service.interface";
import {ApiResponse, ApiResponseMessages, ApiValidationError} from "../../src/service/error.interface";
import {ServiceRouterTestData} from "./service.router.test.data";

describe("Services Api tests", () => {

    const API_URL: string = "http://localhost:8080";
    const SERVICES_URI: string = "/v1/services";
    const DEPLOYMENT_MAX_WAIT_TIME: number = 7 * 1000;
    const DEPLOYMENT_TEST_TIMEOUT: number = DEPLOYMENT_MAX_WAIT_TIME + 2000;

    before(async () => {
        await inMemoryMongoServer.connect();
        await expressServer.start();
    });

    after(async () => {
        await mongoConnection.closeConnection();
        await inMemoryMongoServer.stop();
        await expressServer.stop();
    })

    afterEach(async () =>{
        await inMemoryMongoServer.cleanUp();
    })

    describe("POST /v1/services/ route tests", () => {

        it("should create service", async () => {
            return sendCreateServiceRequest(ServiceRouterTestData.createNewService(uuid()));
        });

        it("should not create service with existing id", async () => {

            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            const service: Service = {id: id, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "id", message: "id already in use"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

        it("should not create service with missing id", async () => {
            const service: Service = {id: "", image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "id", message: "Invalid value"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

        it("should not create service with image", async () => {
            const service: Service = {id: uuid(), image: "", createdAt: "123", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "image", message: "Invalid value"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

        it("should not create service with createdAt", async () => {
            const service: Service = {id: uuid(), image: "liferay/portal@latest", createdAt: "", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "createdAt", message: "Invalid value"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

        it("should not create service with type", async () => {
            const service: any = {id: uuid(), image: "liferay/portal@latest", createdAt: "123", type: "", cpu: 1, memory: 1024}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "type", message: "Invalid value"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

        it("should not create service with invalid numbers of cpu", async () => {

            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "cpu", message: "Invalid value"}];

            const service: Service = {id: uuid(), image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 4, memory: 1024}
            await sendCreateServiceWithBadRequest(service, expectedValidationErrors);

            const service2: Service = {id: uuid(), image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: -1, memory: 1024}
            await sendCreateServiceWithBadRequest(service2, expectedValidationErrors);

            const service3: any = {id: uuid(), image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: "a1", memory: 1024}
            return  sendCreateServiceWithBadRequest(service3, expectedValidationErrors);
        });

        it("should not create service with invalid numbers of memory", async () => {
            const service: any = {id: uuid(), image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 2, memory: "a1024"}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "memory", message: "Invalid value"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

        it("should not create service with deploymentStatus", async () => {
            const service: any = {id: uuid(), image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 2, memory: 1024, deploymentStatus: DeploymentStatus.RUNNING}
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "deploymentStatus", message: "Invalid value"}];

            return sendCreateServiceWithBadRequest(service, expectedValidationErrors);
        });

    })

    describe("GET /v1/services/:id route tests", () => {

        it("should find service by id", async () => {

            const id: string = uuid();

            const expectedService: Service = {
                id: id,
                image: "liferay/portal@latest",
                createdAt: "123",
                type: ServiceType.Deployment,
                cpu: 1,
                memory: 1024,
                deploymentStatus: DeploymentStatus.PENDING
            };

            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));
            return sendFindServiceByIdRequest(id, expectedService);

        });

        it("should not find service by id when it does not exists", async () => {
            return request(API_URL)
                .get(SERVICES_URI + `/${uuid()}`)
                .expect(404)
                .expect('Content-type', /json/)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    assertNotFoundApiResponse(body);
                });
        });

    })

    describe("GET /v1/services route tests", () => {

        it("should retrieve no services", async () => {
            return sendGetServicesRequest("", []);
        });

        it("should retrieve all created services sorting by creation time by default", async () => {

            const firstServiceId: string = uuid();
            const firstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedFirstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(firstService);

            const secondServiceId: string = uuid();
            const secondService: Service = {id: secondServiceId, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048}
            const expectedSecondService: Service = {id: secondServiceId, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(secondService);

            const thirdServiceId: string = uuid();
            const thirdService: Service = {id: thirdServiceId, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 3, memory: 3072}
            const expectedThirdService: Service = {id: thirdServiceId, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 3, memory: 3072, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(thirdService);

            return request(API_URL)
                .get(SERVICES_URI)
                .expect('Content-type', /json/)
                .expect(200)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    assertSuccessApiResponse(body);

                    const services: Array<Service> = body.response;
                    expect(services.length).to.equal(3);
                    assertService(services[0], expectedFirstService);
                    assertService(services[1], expectedSecondService);
                    assertService(services[2], expectedThirdService);
                });
        })

        it("should retrieve all created services sorting by image and creation time", async () => {

            const firstServiceId: string = uuid();
            const firstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedFirstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(firstService);

            const secondServiceId: string = uuid();
            const secondService: Service = {id: secondServiceId, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048}
            const expectedSecondService: Service = {id: secondServiceId, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(secondService);

            const thirdServiceId: string = uuid();
            const thirdService: Service = {id: thirdServiceId, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 3, memory: 3072}
            const expectedThirdService: Service = {id: thirdServiceId, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 3, memory: 3072, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(thirdService);

            return sendGetServicesRequest("?sort=IMAGE", [expectedThirdService, expectedFirstService, expectedSecondService]);
        })

        it("should return bad request when trying to sort by invalid parameter", async () => {

            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "sort", message: "Invalid value"}];

            return request(API_URL)
                .get(SERVICES_URI + "?sort=something-else")
                .expect('Content-type', /json/)
                .expect(400)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    assertBadRequestApiResponse(body);

                    const validationErrors: Array<ApiValidationError> = body.response;
                    assertValidationErrors(validationErrors, expectedValidationErrors);
                });
        })

    })

    describe("POST /v1/services/deploy/:id route tests", () => {

        it("should deploy service", async () => {
            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));
            return sendDeployServiceRequest(id);
        })

        it("should deploy service and get deployment status as pending", async () => {
            const id: string = uuid();
            const service: Service = {id: id, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048}
            const expectedService: Service = {id: id, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048, deploymentStatus: DeploymentStatus.PENDING}

            await sendCreateServiceRequest(service);
            await sendDeployServiceRequest(id);
            return sendFindServiceByIdRequest(id, expectedService);
        })

        it("should deploy service and get deployment status as running", async () => {

            const id: string = uuid();
            const service: Service = {id: id, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048}
            const expectedService: Service = {id: id, image: "liferay/portal@v2", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048, deploymentStatus: DeploymentStatus.RUNNING}

            await sendCreateServiceRequest(service);
            await sendDeployServiceRequest(id);
            await waitDeploymentFinish();

            return sendFindServiceByIdRequest(id, expectedService);
        })
        .timeout(DEPLOYMENT_TEST_TIMEOUT)

        it("should not deploy service when service does not exist", async () => {
            return request(API_URL)
                .post(SERVICES_URI + `/deploy/${uuid()}`)
                .expect(404)
                .expect('Content-type', /json/)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    assertNotFoundApiResponse(body);
                });
        })

        it("should schedule but not deploy service when image is not valid", async () => {

            const id: string = uuid();
            const service: Service = {id: id, image: "unexisting/image", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048}
            const expectedService: Service = {id: id, image: "unexisting/image", createdAt: "456", type: ServiceType.Deployment, cpu: 2, memory: 2048, deploymentStatus: DeploymentStatus.PENDING}

            await sendCreateServiceRequest(service);
            await sendDeployServiceRequest(id);
            await waitDeploymentFinish();

            return sendFindServiceByIdRequest(id, expectedService);
        })
        .timeout(DEPLOYMENT_TEST_TIMEOUT)

    })

    function sendCreateServiceRequest(service: Service) {
        return request(API_URL)
            .post(SERVICES_URI)
            .send(service)
            .expect(201)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                expect(body.message).to.equal("Success");
                expect(body.transactionId).to.not.empty;
                expect(body.timestamp).to.not.empty;
                expect(body.response.id).to.equal(service.id);
            });
    }

    function sendCreateServiceWithBadRequest(service: Service, expectedValidationErrors: Array<ApiValidationError>) {
        return request(API_URL)
            .post(SERVICES_URI)
            .send(service)
            .expect(400)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                assertBadRequestApiResponse(body);

                const validationErrors: Array<ApiValidationError> = body.response;
                assertValidationErrors(validationErrors, expectedValidationErrors);
            });
    }

    function sendDeployServiceRequest(id: string) {
        return request(API_URL)
            .post(SERVICES_URI + `/deploy/${id}`)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                expect(body.message).to.equal("Success");
                expect(body.transactionId).to.not.empty;
                expect(body.timestamp).to.not.empty;
                expect(body.response.status).to.equal('Deployment scheduled');
            });
    }

    function sendFindServiceByIdRequest(id: string, expectedService: Service) {
        return request(API_URL)
            .get(SERVICES_URI + `/${id}`)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                assertSuccessApiResponse(body);

                const service: Service = body.response;
                assertServiceById(service, expectedService);
            });
    }

    function sendGetServicesRequest(sort: string, expectedServices: Array<Service>) {
        return request(API_URL)
            .get(SERVICES_URI + sort)
            .expect('Content-type', /json/)
            .expect(200)
            .then((response) => {
                const body: ApiResponse = response.body;
                assertSuccessApiResponse(body);

                const services: Array<Service> = body.response;
                expect(services.length).to.equal(expectedServices.length);

                expectedServices.forEach((expectedService, index) => {
                    assertService(services[index], expectedService);
                });
            });
    }

    function assertService(service: Service, expectedService: Service) {
        expect(service.id).to.equal(expectedService.id);
        expect(service.image).to.equal(expectedService.image);
        expect(service.type).to.equal(expectedService.type);
        expect(service.createdAt).to.not.empty;
        expect(service.cpu).to.equal(expectedService.cpu);
        expect(service.memory).to.equal(expectedService.memory);
    }

    function assertValidationErrors(validationErrors: Array<ApiValidationError>,
                                           expectedValidationErrors: Array<ApiValidationError>) {
        expectedValidationErrors.forEach((error, index) => {
            const validationError = validationErrors[index];
            const expectedValidationError = expectedValidationErrors[index];
            expect(validationError.fieldName).to.equal(expectedValidationError.fieldName);
            expect(validationError.message).to.equal(expectedValidationError.message);
        });
    }

    function assertServiceById(service: Service, expectedService: Service) {
        assertService(service, expectedService)
        expect(service.deploymentStatus).to.equal(expectedService.deploymentStatus);
    }


    function assertSuccessApiResponse(apiResponse: ApiResponse) {
        assertApiResponse(ApiResponseMessages.SUCCESS, apiResponse);
    }

    function assertBadRequestApiResponse(apiResponse: ApiResponse) {
        assertApiResponse(ApiResponseMessages.BAD_REQUEST, apiResponse);
    }

    function assertNotFoundApiResponse(apiResponse: ApiResponse) {
        assertApiResponse(ApiResponseMessages.NOT_FOUND, apiResponse);
    }

    function assertApiResponse(expectedMessage: string, apiResponse: ApiResponse) {
        expect(apiResponse.message).to.equal(expectedMessage);
        expect(apiResponse.transactionId).to.not.empty;
        expect(apiResponse.timestamp).to.not.empty;
    }

    async function waitDeploymentFinish() {
        return new Promise<void>(resolve => {
            setTimeout(() => resolve(), DEPLOYMENT_MAX_WAIT_TIME);
        });
    }

});
