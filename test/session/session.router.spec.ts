import {describe} from "mocha";
import {expect} from "chai";
import request from "supertest";
import expressServer from "../../src/express/express.server";
import inMemoryMongoServer from "../inmemory.mongo.server";
import mongoConnection from "../../src/mongo";
import {ApiResponse, ApiResponseMessage, ApiValidationError} from "../../src/service/error.interface";
import {LoginRequest} from "../../src/session/session.interfaces";
import {JwtTokenDetails} from "../../src/session/jwt.interfaces";
import {TestsAssertionUtils} from "../utils/tests.assertion.utils";
import {AuthenticationUtils} from "./authentication.utils";
import configLoader from "../../src/config/config.loader";

describe("Session Api tests", () => {

    const API_URL: string = "http://localhost:8080";
    const LOGIN_URI: string = "/v1/sessions/login";
    const LOGOUT_URI: string = "/v1/sessions/logout";

    before(async () => {
        await configLoader.load();
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

    describe("POST /v1/sessions/login route tests", () => {

        it("should login successfully with admin credentials", async () => {
            return sendLoginRequest(AuthenticationUtils.ADMIN_USER_CREDENTIALS);
        });

        it("should login successfully with contributor credentials", async () => {
            return sendLoginRequest(AuthenticationUtils.CONTRIBUTOR_USER_CREDENTIALS);
        });

        it("should login successfully with contributor guest", async () => {
            return sendLoginRequest(AuthenticationUtils.GUEST_USER_CREDENTIALS);
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

    describe("POST /v1/sessions/logout route tests", () => {

        it("should logout successfully with admin credentials", async () => {
            const jwtToken: string = await AuthenticationUtils.login(AuthenticationUtils.ADMIN_USER_CREDENTIALS);
            return sendLogoutRequest(jwtToken);
        });

        it("should logout successfully with contributor credentials", async () => {
            const jwtToken: string = await AuthenticationUtils.login(AuthenticationUtils.CONTRIBUTOR_USER_CREDENTIALS);
            return sendLogoutRequest(jwtToken);
        });

        it("should logout successfully with contributor guest", async () => {
            const jwtToken: string = await AuthenticationUtils.login(AuthenticationUtils.GUEST_USER_CREDENTIALS);
            return sendLogoutRequest(jwtToken);
        });

        it("should not logout without jwt token", async () => {
            return request(API_URL)
                .post(LOGOUT_URI)
                .expect(401)
                .expect('Content-type', /json/)
                .then((response) => {
                    TestsAssertionUtils.assertApiResponse(ApiResponseMessage.UNAUTHORIZED, response.body);
                });
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
                TestsAssertionUtils.assertSuccessApiResponse(body);

                const jwtTokenDetails: JwtTokenDetails = body.response;
                expect(jwtTokenDetails.token).to.not.empty;
                expect(jwtTokenDetails.expiration).to.not.empty;
            });
    }

    function sendLogoutRequest(jwtToken: string) {
        return request(API_URL)
            .post(LOGOUT_URI)
            .set("Authorization", jwtToken)
            .expect(200)
            .expect('Content-type', /json/)
            .then((response) => {
                TestsAssertionUtils.assertSuccessApiResponse(response.body);
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
                TestsAssertionUtils.assertBadRequestApiResponse(body);

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
                TestsAssertionUtils.assertBadRequestApiResponse(body);

                TestsAssertionUtils.assertValidationErrors(body.response, expectedValidationErrors);
            });
    }

});
