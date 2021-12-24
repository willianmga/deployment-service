import {describe} from "mocha";
import {expect} from "chai";
import request from "supertest";
import {v4 as uuid} from "uuid";
import expressServer from "../../src/express/express.server";
import inMemoryMongoServer from "../inmemory.mongo.server";
import mongoConnection from "../../src/mongo";
import {DeploymentStatus, Service, ServiceType} from "../../src/service/service.interface";
import {ApiResponse, ApiResponseMessage, ApiValidationError} from "../../src/service/error.interface";
import {ServiceRouterTestData} from "./service.router.test.data";
import {AuthenticationUtils} from "../session/authentication.utils";
import configLoader from "../../src/config/config.loader";
import {TestsAssertionUtils} from "../utils/tests.assertion.utils";

describe("Services Api tests", () => {

    const API_URL: string = "http://localhost:8080";
    const SERVICES_URI: string = "/v1/services";
    const DEPLOYMENT_MAX_WAIT_TIME: number = 7 * 1000;
    const DEPLOYMENT_TEST_TIMEOUT: number = DEPLOYMENT_MAX_WAIT_TIME + 2000;

    let JWT_TOKEN: string;

    before(async () => {
        await configLoader.load();
        await inMemoryMongoServer.connect();
        await expressServer.start();
    })

    beforeEach(async () => {
        JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.ADMIN_USER_CREDENTIALS);
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

        it("should create service with admin role", async () => {
            return sendCreateServiceRequest(ServiceRouterTestData.createNewService(uuid()));
        });

        it("should create service with contributor role", async () => {
            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.CONTRIBUTOR_USER_CREDENTIALS);
            return sendCreateServiceRequest(ServiceRouterTestData.createNewService(uuid()));
        });

        it("should not create service with guest role", async () => {
            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.GUEST_USER_CREDENTIALS);

            return request(API_URL)
                .post(SERVICES_URI)
                .set("Authorization", JWT_TOKEN)
                .send(ServiceRouterTestData.createNewService(uuid()))
                .expect(403)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertApiResponse(ApiResponseMessage.FORBIDDEN, response.body)
                });
        });

        it("should not create service without jwt token", async () => {
            return request(API_URL)
                .post(SERVICES_URI)
                .send(ServiceRouterTestData.createNewService(uuid()))
                .expect(401)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertApiResponse(ApiResponseMessage.UNAUTHORIZED, response.body)
                });
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

        it("should find service by id with admin role", async () => {
            const id: string = uuid();
            const expectedService: Service = {id: id, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING};
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));
            return sendFindServiceByIdRequest(id, expectedService);
        });

        it("should find service by id with contributor role", async () => {

            const id: string = uuid();
            const expectedService: Service = {id: id, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING};
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.CONTRIBUTOR_USER_CREDENTIALS);

            return sendFindServiceByIdRequest(id, expectedService);
        });

        it("should find service by id with guest role", async () => {
            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.GUEST_USER_CREDENTIALS);

            const expectedService: Service = {id: id, image: "liferay/portal@latest", createdAt: "123", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING};
            return sendFindServiceByIdRequest(id, expectedService);
        });

        it("should not get service by id without jwt token", async () => {
            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            return request(API_URL)
                .get(SERVICES_URI + `/${id}`)
                .expect(401)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertApiResponse(ApiResponseMessage.UNAUTHORIZED, response.body);
                });
        });

        it("should not find service by id when it does not exists", async () => {
            return request(API_URL)
                .get(SERVICES_URI + `/${uuid()}`)
                .set("Authorization", JWT_TOKEN)
                .expect(404)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertNotFoundApiResponse(response.body);
                });
        });

    })

    describe("GET /v1/services route tests", () => {

        it("should retrieve no services", async () => {
            return sendGetServicesRequest("", []);
        });

        it("should retrieve all services with admin role", async () => {

            const firstServiceId: string = uuid();
            const firstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedFirstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(firstService);

            return request(API_URL)
                .get(SERVICES_URI)
                .set("Authorization", JWT_TOKEN)
                .expect('Content-type', /json/)
                .expect(200)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    TestsAssertionUtils.assertSuccessApiResponse(body);

                    const services: Array<Service> = body.response;
                    expect(services.length).to.equal(1);
                    assertService(services[0], expectedFirstService);
                });
        })

        it("should retrieve all services with contributor role", async () => {

            const firstServiceId: string = uuid();
            const firstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedFirstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(firstService);

            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.CONTRIBUTOR_USER_CREDENTIALS);

            return request(API_URL)
                .get(SERVICES_URI)
                .set("Authorization", JWT_TOKEN)
                .expect('Content-type', /json/)
                .expect(200)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    TestsAssertionUtils.assertSuccessApiResponse(body);

                    const services: Array<Service> = body.response;
                    expect(services.length).to.equal(1);
                    assertService(services[0], expectedFirstService);
                });
        })

        it("should retrieve all services with guest role", async () => {

            const firstServiceId: string = uuid();
            const firstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024}
            const expectedFirstService: Service = {id: firstServiceId, image: "liferay/portal@v1", createdAt: "789", type: ServiceType.Deployment, cpu: 1, memory: 1024, deploymentStatus: DeploymentStatus.PENDING}
            await sendCreateServiceRequest(firstService);

            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.GUEST_USER_CREDENTIALS);

            return request(API_URL)
                .get(SERVICES_URI)
                .set("Authorization", JWT_TOKEN)
                .expect('Content-type', /json/)
                .expect(200)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    TestsAssertionUtils.assertSuccessApiResponse(body);

                    const services: Array<Service> = body.response;
                    expect(services.length).to.equal(1);
                    assertService(services[0], expectedFirstService);
                });
        })

        it("should not get services without jwt token", async () => {

            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            return request(API_URL)
                .get(SERVICES_URI)
                .expect(401)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertApiResponse(ApiResponseMessage.UNAUTHORIZED, response.body);
                });
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
                .set("Authorization", JWT_TOKEN)
                .expect('Content-type', /json/)
                .expect(200)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    TestsAssertionUtils.assertSuccessApiResponse(body);

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
                .set("Authorization", JWT_TOKEN)
                .expect('Content-type', /json/)
                .expect(400)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    TestsAssertionUtils.assertBadRequestApiResponse(body);

                    const validationErrors: Array<ApiValidationError> = body.response;
                    TestsAssertionUtils.assertValidationErrors(validationErrors, expectedValidationErrors);
                });
        })

    })

    describe("POST /v1/services/deploy/:id route tests", () => {

        it("should deploy service with admin role", async () => {
            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));
            return sendDeployServiceRequest(id);
        })

        it("should not deploy service with contributor role", async () => {

            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.CONTRIBUTOR_USER_CREDENTIALS);

            return sendDeployServiceRequestForbidden(id);
        })

        it("should not deploy service with guest role", async () => {

            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            JWT_TOKEN = await AuthenticationUtils.login(AuthenticationUtils.GUEST_USER_CREDENTIALS);

            return sendDeployServiceRequestForbidden(id);
        })

        it("should not deploy service without jwt token", async () => {

            const id: string = uuid();
            await sendCreateServiceRequest(ServiceRouterTestData.createNewService(id));

            return request(API_URL)
                .post(SERVICES_URI + `/deploy/${id}`)
                .expect(401)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertApiResponse(ApiResponseMessage.UNAUTHORIZED, response.body);
                });
        });

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
                .set("Authorization", JWT_TOKEN)
                .expect(404)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertNotFoundApiResponse(response.body);
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
            .set("Authorization", JWT_TOKEN)
            .send(service)
            .expect(201)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                TestsAssertionUtils.assertSuccessApiResponse(body);

                expect(body.response.id).to.equal(service.id);
            });
    }

    function sendCreateServiceWithBadRequest(service: Service, expectedValidationErrors: Array<ApiValidationError>) {
        return request(API_URL)
            .post(SERVICES_URI)
            .set("Authorization", JWT_TOKEN)
            .send(service)
            .expect(400)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                TestsAssertionUtils.assertBadRequestApiResponse(body);

                const validationErrors: Array<ApiValidationError> = body.response;
                TestsAssertionUtils.assertValidationErrors(validationErrors, expectedValidationErrors);
            });
    }

    function sendDeployServiceRequest(id: string) {
        return request(API_URL)
            .post(SERVICES_URI + `/deploy/${id}`)
            .set("Authorization", JWT_TOKEN)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                TestsAssertionUtils.assertSuccessApiResponse(body);

                expect(body.response.status).to.equal('Deployment scheduled');
            });
    }

    function sendDeployServiceRequestForbidden(id: string) {
        return request(API_URL)
            .post(SERVICES_URI + `/deploy/${id}`)
            .set("Authorization", JWT_TOKEN)
            .expect(403)
            .expect('Content-type', /json/)
            .then((response) => {
                TestsAssertionUtils.assertApiResponse(ApiResponseMessage.FORBIDDEN, response.body);
            });
    }

    function sendFindServiceByIdRequest(id: string, expectedService: Service) {
        return request(API_URL)
            .get(SERVICES_URI + `/${id}`)
            .set("Authorization", JWT_TOKEN)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                TestsAssertionUtils.assertSuccessApiResponse(body);

                const service: Service = body.response;
                assertServiceById(service, expectedService);
            });
    }

    function sendGetServicesRequest(sort: string, expectedServices: Array<Service>) {
        return request(API_URL)
            .get(SERVICES_URI + sort)
            .set("Authorization", JWT_TOKEN)
            .expect('Content-type', /json/)
            .expect(200)
            .then((response) => {
                const body: ApiResponse = response.body;
                TestsAssertionUtils.assertSuccessApiResponse(body);

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

    function assertServiceById(service: Service, expectedService: Service) {
        assertService(service, expectedService)
        expect(service.deploymentStatus).to.equal(expectedService.deploymentStatus);
    }

    async function waitDeploymentFinish() {
        return new Promise<void>(resolve => {
            setTimeout(() => resolve(), DEPLOYMENT_MAX_WAIT_TIME);
        });
    }

});
