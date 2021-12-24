import {NextFunction, Request, Response} from "express";
import {ApiResponseUtils} from "./api.response.utils";
import {ApiErrorType, ApiResponseMessage} from "../service/error.interface";
import {JwtTokenService} from "../session/jwt.token.service";
import {ParsedJwtTokenDetails} from "../session/jwt.interfaces";
import {MongoUserRepository} from "../user/mongo.user.repository";
import {MongoSessionRepository} from "../session/mongo.session.repository";

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

    try {

        const jwtToken: string = getJwtTokenFromRequest(req);
        const jwtTokenDetails: ParsedJwtTokenDetails = await tokenService.parseJwtToken(jwtToken);

        await Promise
            .all([
                mongoUserRepository.findUserById(jwtTokenDetails.userId),
                mongoSessionRepository.findActiveSessionById(jwtTokenDetails.sessionId)
            ])
            .then(([user, session]) => {

                if (session.userId !== user.id) {
                    throw Error(ApiErrorType.NOT_FOUND);
                }

                req.sessionDetails = {
                    sessionId: session.id,
                    userId: user.id,
                    username: user.username,
                    userRole: user.role
                };

                next();
            });

    } catch (error) {
        return res.status(401).json(ApiResponseUtils.errorResponse(getApiResponseMessage(error)));
    }

}

function getJwtTokenFromRequest(req: Request): string {
    const authorizationHeader: string = req.header(AUTHORIZATION_HEADER)
    const jwtToken: string = authorizationHeader && authorizationHeader.split(" ")[1];

    if (!jwtToken) {
        throw Error(ApiErrorType.TOKEN_NOT_PROVIDED);
    }

    return jwtToken;
}

function getApiResponseMessage(error: any): ApiResponseMessage {
    switch (error) {
        case ApiErrorType.NOT_FOUND: return ApiResponseMessage.SESSION_TERMINATED;
        case ApiErrorType.INVALID_JWT_TOKEN: return ApiResponseMessage.JWT_TOKEN_INVALID_EXPIRED;
        default: return ApiResponseMessage.UNAUTHORIZED;
    }
}
