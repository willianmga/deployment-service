import {describe} from "mocha";
import {expect} from "chai";
import request from "supertest";
import expressServer from "../../src/express/express.server";
import inMemoryMongoServer from "../inmemory.mongo.server";
import mongoConnection from "../../src/mongo";
import {ApiResponse, ApiResponseMessages, ApiValidationError} from "../../src/service/error.interface";
import {LoginRequest} from "../../src/session/session.interfaces";
import {JwtTokenDetails} from "../../src/session/jwt.interfaces";
import {TestsAssertionUtils} from "../utils/tests.assertion.utils";

describe("Session Api tests", () => {

    const API_URL: string = "http://localhost:8080";
    const LOGIN_URI: string = "/v1/sessions/login";
    const LOGOUT_URI: string = "/v1/sessions/logout";

    before(async () => {
        await inMemoryMongoServer.connect();
        await inMemoryMongoServer.loadUsersData();
        await expressServer.start();
    });

    after(async () => {
        await mongoConnection.closeConnection();
        await inMemoryMongoServer.stop();
        await expressServer.stop();
    })

    afterEach(async () =>{
        await inMemoryMongoServer.cleanUp();
        await inMemoryMongoServer.loadUsersData();
    })

    describe("POST /v1/sessions/login route tests", () => {

        it("should login successfully", async () => {
            return sendLoginRequest({username: "admin", password: "strongpassword"});
        });

        it("should fail to login with invalid credentials and 401 status", async () => {
            await sendLoginRequestWithInvalidCredentials({username: "admin123", password: "strongpassword"});
            return sendLoginRequestWithInvalidCredentials({username: "admin", password: "strongpassword123"});
        });

        it("should fail to login with missing credential details and 400 status", async () => {
            const expectedValidationErrors: Array<ApiValidationError> = [{fieldName: "username", message: "Invalid value"}, {fieldName: "password", message: "Invalid value"}];
            await sendLoginRequestWithInvalidMissingCredentialsDetails({username: "", password: ""}, expectedValidationErrors);

            const expectedValidationErrors2: Array<ApiValidationError> = [{fieldName: "username", message: "Invalid value"}];
            await sendLoginRequestWithInvalidMissingCredentialsDetails({username: "", password: "strongpassword"}, expectedValidationErrors2);

            const expectedValidationErrors3: Array<ApiValidationError> = [{fieldName: "password", message: "Invalid value"}];
            return sendLoginRequestWithInvalidMissingCredentialsDetails({username: "admin", password: ""}, expectedValidationErrors3);
        });

    });

    function sendLoginRequest(loginRequest: LoginRequest) {
        return request(API_URL)
            .post(LOGIN_URI)
            .send(loginRequest)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                assertSuccessApiResponse(body);

                const jwtTokenDetails: JwtTokenDetails = body.response;
                expect(jwtTokenDetails.token).to.not.empty;
                expect(jwtTokenDetails.expiration).to.not.empty;
            });
    }

    function sendLoginRequestWithInvalidCredentials(loginRequest: LoginRequest) {
        return request(API_URL)
            .post(LOGIN_URI)
            .send(loginRequest)
            .expect(401)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                assertBadRequestApiResponse(body);

                expect(body.response.message).to.equal("Invalid Credentials");
            });
    }

    function sendLoginRequestWithInvalidMissingCredentialsDetails(loginRequest: LoginRequest,
                                                                  expectedValidationErrors: Array<ApiValidationError>) {
        return request(API_URL)
            .post(LOGIN_URI)
            .send(loginRequest)
            .expect(400)
            .expect('Content-type', /json/)
            .then((response) => {
                const body: ApiResponse = response.body;
                assertBadRequestApiResponse(body);

                TestsAssertionUtils.assertValidationErrors(body.response, expectedValidationErrors);
            });
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

});
