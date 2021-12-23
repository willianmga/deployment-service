import express, {Request, Response} from "express";
import {body, validationResult} from "express-validator";
import {ApiErrorType, ApiResponseMessage, ApiValidationError} from "../service/error.interface";
import {ApiResponseUtils} from "../express/api.response.utils";
import {SessionService} from "./session.service";
import {logger} from "../logger";

export const sessionRouter = express.Router();
const sessionService = new SessionService();

/**
 * Login
 */
sessionRouter.post("/login", validateLoginRequest(), async (req: Request, res: Response) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const validationErrors: ApiValidationError[] = ApiResponseUtils.mapToApiValidationError(errors.array());
        return res.status(400).json(ApiResponseUtils.badRequestResponse(validationErrors));
    }

    sessionService.login(req.body)
        .then((response) => res.status(200).json(ApiResponseUtils.successResponse(response)))
        .catch(error => {
            if (error === ApiErrorType.INVALID_CREDENTIALS) {
                return res.status(401).json(ApiResponseUtils.badRequestResponse({message: "Invalid Credentials"}))
            }
            logger.error(`Error happened: ${error}`);
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR))
        });
});

/**
 * Logout
 */
sessionRouter.post("/logout", async (req: Request, res: Response) => {
    sessionService.logout(req.sessionDetails)
        .then((response) => res.status(200).json(ApiResponseUtils.successResponse(response)))
        .catch((error) => {
            logger.error(`Error happened: ${error}`);
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR))
        });
});

function validateLoginRequest() {
    return [
        body("username").notEmpty(),
        body("password").notEmpty()
    ]
}
