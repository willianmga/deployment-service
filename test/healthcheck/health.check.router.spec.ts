import {describe} from "mocha";
import request from "supertest";
import {TestsAssertionUtils} from "../utils/tests.assertion.utils";
import configLoader from "../../src/config/config.loader";
import inMemoryMongoServer from "../inmemory.mongo.server";
import expressServer from "../../src/express/express.server";
import mongoConnection from "../../src/mongo";
import {ApiResponseMessage} from "../../src/service/error.interface";

describe("Health check tests", () => {

    before(async () => {
        await configLoader.load();
        await expressServer.start();
    });

    after(async () => {
        await mongoConnection.closeConnection();
        await inMemoryMongoServer.stop();
        await expressServer.stop();
    })

    const API_URL: string = "http://localhost:8080";
    const HEALTH_CHECK_URI: string = "/v1/healthcheck";

    it("should return 200 healthcheck when database is connected", async () => {

        await inMemoryMongoServer.connect();

        return request(API_URL)
            .get(HEALTH_CHECK_URI)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                TestsAssertionUtils.assertSuccessApiResponse(response.body);
            });
    });

    it("should return 500 status when database is down", async () => {

        await inMemoryMongoServer.stop();

        return request(API_URL)
            .get(HEALTH_CHECK_URI)
            .expect(500)
            .expect('Content-type', /json/)
            .then((response) => {
                TestsAssertionUtils.assertApiResponse(ApiResponseMessage.UNEXPECTED_ERROR, response.body);
            });
    });

});
