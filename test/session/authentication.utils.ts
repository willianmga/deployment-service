import request from "supertest";
import {ApiResponse} from "../../src/service/error.interface";
import {expect} from "chai";
import {LoginRequest} from "../../src/session/session.interfaces";
import {JwtTokenDetails} from "../../src/session/jwt.interfaces";
import {logger} from "../../src/logger";

export class AuthenticationUtils {

    static readonly API_URL: string = "http://localhost:8080";
    static readonly LOGIN_URI: string = "/v1/sessions/login";
    static readonly LOGOUT_URI: string = "/v1/sessions/logout";

    static readonly ADMIN_USER_CREDENTIALS: LoginRequest = {username: "admin", password: "strongpassword"};
    static readonly CONTRIBUTOR_USER_CREDENTIALS: LoginRequest = {username: "contributor", password: "evenstrongerpassword"};
    static readonly GUEST_USER_CREDENTIALS: LoginRequest = {username: "guest", password: "password"};

    static async login(loginRequest: LoginRequest): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            await request(AuthenticationUtils.API_URL)
                .post(AuthenticationUtils.LOGIN_URI)
                .send(loginRequest)
                .expect(200)
                .expect('Content-type', /json/)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    //assertSuccessApiResponse(body);

                    const jwtTokenDetails: JwtTokenDetails = body.response;
                    expect(jwtTokenDetails.token).to.not.empty;
                    expect(jwtTokenDetails.expiration).to.not.empty;

                    resolve(jwtTokenDetails.token);
                })
                .catch(error => reject(error));
        });
    }

    static async logoff(jwtToken: string): Promise<void> {
        return new Promise<void>(async (resolve) => {
            await request(AuthenticationUtils.API_URL)
                .post(AuthenticationUtils.LOGOUT_URI)
                .set("Authorization", jwtToken)
                .expect(200)
                .expect('Content-type', /json/)
                .then((response) => {
                    const body: ApiResponse = response.body;
                    //assertSuccessApiResponse(body);
                    resolve();
                });
        });
    }

}
