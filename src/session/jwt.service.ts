import jwt from "jsonwebtoken";
import {Session} from "./session.interfaces";
import {JwtTokenDetails} from "./jwt.interfaces";

export class JwtService {

    generateJwtToken(session: Session): JwtTokenDetails {
        return {
            token: "Bearer ",
            expiration: session.expirationDate
        }
    }

}
