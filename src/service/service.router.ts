import express, {Request, Response} from "express";
import {body, param, validationResult} from "express-validator";
import {ServiceService} from "./service.service";
import {ApiErrorType, ApiResponseMessages, ValidationError, ValidationErrorType} from "./error.interface";
import {ServiceType} from "./service.interface";
import {ApiResponseUtils} from "../express/api.response.utils";

export const serviceRouter = express.Router();
const serviceService = new ServiceService();

/**
 * Create Service
 */
serviceRouter.post("/", validateCreateServiceRequest(), async (req: Request, res: Response) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponseUtils.badRequestResponse(errors.array()));
    }

    serviceService
        .createService(req.body)
        .then(result => res.status(201).json(ApiResponseUtils.successResponse({id: result})))
        .catch(error => {

            if (error === ApiErrorType.DB_ERROR) {
                const validationError: ValidationError = {
                    fieldName: "id",
                    errorType: ValidationErrorType.ID_IN_USE
                };
                return res.status(400).json(ApiResponseUtils.badRequestResponse([validationError]))
            }

            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessages.UNEXPECTED_ERROR))
        });
});

/**
 * Deploy Service by Id
 */
serviceRouter.post("/deploy/:id", validateIdOnPath(), async (req: Request, res: Response) => {
    serviceService
        .deployService(req.params.id)
        .then(result => res.status(200).json(ApiResponseUtils.successResponse(result)))
        .catch(error => {
            if (error === ApiErrorType.NOT_FOUND) {
                return res.status(404).json(ApiResponseUtils.errorResponse(ApiResponseMessages.NOT_FOUND))
            }
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessages.UNEXPECTED_ERROR));
        });
});

/**
 * Get Services
 */
serviceRouter.get("/", async (req: Request, res: Response) => {
    serviceService
        .getServices()
        .then(result => res.status(200).json(ApiResponseUtils.successResponse(result)))
        .catch(error => res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessages.UNEXPECTED_ERROR)));
});

/**
 * Get Service by Id
 */
serviceRouter.get("/:id", validateIdOnPath(), async (req: Request, res: Response) => {
    serviceService
        .getServiceById(req.params.id)
        .then(result => res.status(200).json(ApiResponseUtils.successResponse(result)))
        .catch(error => {
            if (error === ApiErrorType.NOT_FOUND) {
                return res.status(404).json(ApiResponseUtils.errorResponse(ApiResponseMessages.NOT_FOUND))
            }
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessages.UNEXPECTED_ERROR));
        });
});

function validateIdOnPath() {
    return [
        param("id").notEmpty()
    ];
}

function validateCreateServiceRequest() {
    return [
        body("id").notEmpty(),
        body("image").notEmpty(),
        body("type").notEmpty().isIn([ServiceType.Deployment, ServiceType.StatefulSet]),
        body("createdAt").notEmpty(),
        body("cpu").optional().isInt().isIn([1, 2, 3]),
        body("memory").optional().isInt()
    ]
}
