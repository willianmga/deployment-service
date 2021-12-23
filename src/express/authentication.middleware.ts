import {NextFunction, Request, Response} from "express";
import {ApiResponseUtils} from "./api.response.utils";
import {ApiErrorType, ApiResponseMessages} from "../service/error.interface";
import {JwtTokenService} from "../session/jwt.token.service";
import {ParsedJwtTokenDetails} from "../session/jwt.interfaces";
import {MongoUserRepository} from "../user/mongo.user.repository";
import {MongoSessionRepository} from "../session/mongo.session.repository";
import {logger} from "../logger";

const AUTHORIZATION_HEADER: string = "Authorization";
const tokenService: JwtTokenService = new JwtTokenService();
const mongoUserRepository: MongoUserRepository = new MongoUserRepository();
const mongoSessionRepository: MongoSessionRepository = new MongoSessionRepository();

const whitelistedPaths: string[] = ["/v1/sessions/login", "/v1/healthcheck"]

export const jwtTokenValidationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (whitelistedPaths.includes(req.path)) {
        next();
    } else {
        await validateJwtToken(req, res, next);
    }
}

async function validateJwtToken(req: Request, res: Response, next: NextFunction) {

    const authorizationHeader: string = req.header(AUTHORIZATION_HEADER)
    const jwtToken: string = authorizationHeader && authorizationHeader.split(" ")[1];

    if (!jwtToken) {
        return res.status(401).json(ApiResponseUtils.errorResponse(ApiResponseMessages.UNAUTHORIZED));
    }

    try {
        const jwtTokenDetails: ParsedJwtTokenDetails = await tokenService.parseJwtToken(jwtToken);

        await Promise
            .all([
                mongoUserRepository.findUserById(jwtTokenDetails.userId),
                mongoSessionRepository.findActiveSessionById(jwtTokenDetails.sessionId)
            ])
            .then(([user, session]) => {
                if (session.userId === user.id) {

                    req.sessionDetails = {
                        sessionId: session.id,
                        userId: user.id,
                        username: user.username,
                        userRole: user.role
                    };

                    logger.info(`Logged user with info ${JSON.stringify(req.sessionDetails)}`)

                    next();
                } else {
                    return res.status(401).json(ApiResponseUtils.errorResponse(ApiResponseMessages.UNAUTHORIZED));
                }
            })
            .catch(error => {
                let apiResponseMessage: ApiResponseMessages = ApiResponseMessages.SESSION_TERMINATED;

                if (error !== ApiErrorType.NOT_FOUND) {
                    apiResponseMessage = ApiResponseMessages.UNAUTHORIZED;
                    logger.error(`Error occurred while checking user credentials. Error: ${error}`);
                }

                return res.status(401).json(ApiResponseUtils.errorResponse(apiResponseMessage));
            });

    } catch (error) {

        const apiResponseMessage: ApiResponseMessages = (error === ApiErrorType.INVALID_JWT_TOKEN)
            ? ApiResponseMessages.JWT_TOKEN_EXPIRED
            : ApiResponseMessages.UNAUTHORIZED;

        return res.status(401).json(ApiResponseUtils.errorResponse(apiResponseMessage));
    }

}
