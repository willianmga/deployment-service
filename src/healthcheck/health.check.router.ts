import express, {Request, Response} from "express";
import {ApiResponseUtils} from "../express/api.response.utils";
import mongoConnection from "../mongo";
import {ApiResponseMessage} from "../service/error.interface";
import {logger} from "../logger";

export const healthCheckRouter = express.Router();

/**
 * Health check
 */
healthCheckRouter.get("/",  async (req: Request, res: Response) => {
    mongoConnection.pingServer()
        .then(() => res.status(200).json(ApiResponseUtils.successResponse({message: "Service running"})))
        .catch(error => {
            logger.error(`Error while checking api health. Error: ${error}`);
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR));
        });
});
