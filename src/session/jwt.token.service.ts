import jwt, {Algorithm, SignOptions, VerifyOptions} from "jsonwebtoken";
import {Session} from "./session.interfaces";
import {JwtTokenDetails, ParsedJwtTokenDetails} from "./jwt.interfaces";
import configLoader from "../config/config.loader";
import {ApiErrorType} from "../service/error.interface";

const JWT_SIGNING_ALGORITHM: Algorithm = "RS512";
const JWT_ISSUER: string = "dps";
const SESSION_DURATION_IN_HOURS: number = 24;
const SESSION_DURATION_IN_HOURS_JWT_FORMAT: string = SESSION_DURATION_IN_HOURS + "h";
export const SESSION_DURATION_IN_SECONDS: number = (SESSION_DURATION_IN_HOURS * 60 * 60);

export class JwtTokenService {

    generateJwtToken(session: Session): JwtTokenDetails {

        const options: SignOptions = {
            issuer: JWT_ISSUER,
            subject: session.userId,
            algorithm: JWT_SIGNING_ALGORITHM,
            expiresIn: SESSION_DURATION_IN_HOURS_JWT_FORMAT
        }

        const jwtToken: string = jwt.sign({ref: session.id}, configLoader.getJwtTokenPrivateKey(), options);

        return {
            token: `Bearer ${jwtToken}`,
            expiration: session.expirationDate
        }
    }

    async parseJwtToken(jwtToken: string): Promise<ParsedJwtTokenDetails> {

        const options: VerifyOptions = {
            algorithms: [JWT_SIGNING_ALGORITHM],
            issuer: JWT_ISSUER,
            ignoreExpiration: false,
            ignoreNotBefore: false
        }

        return new Promise<ParsedJwtTokenDetails>((resolve, reject) => {
            jwt.verify(jwtToken, configLoader.getJwtTokenPrivateKey(), options, (error, token) => {
                if (error) {
                    return reject(ApiErrorType.INVALID_JWT_TOKEN);
                }
                resolve({userId: token.sub, sessionId: token.ref});
            });
        });
    }

}
