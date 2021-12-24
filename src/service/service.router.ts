import express, {Request, Response} from "express";
import {body, param, query, validationResult} from "express-validator";
import {ServiceService} from "./service.service";
import {ApiErrorType, ApiResponseMessage, ApiValidationError} from "./error.interface";
import {ServiceType, SortServicesBy} from "./service.interface";
import {ApiResponseUtils} from "../express/api.response.utils";
import {hasContributorOrHigherRole, hasAdminRole} from "../express/authorization.middleware";

export const serviceRouter = express.Router();
const serviceService = new ServiceService();

/**
 * Create Service
 */
serviceRouter.post("/", hasContributorOrHigherRole, validateCreateServiceRequest(), async (req: Request, res: Response) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const validationErrors: ApiValidationError[] = ApiResponseUtils.mapToApiValidationError(errors.array());
        return res.status(400).json(ApiResponseUtils.badRequestResponse(validationErrors));
    }

    serviceService
        .createService(req.body)
        .then(result => res.status(201).json(ApiResponseUtils.successResponse({id: result})))
        .catch(error => {
            if (error === ApiErrorType.ID_IN_USE) {
                const validationError: ApiValidationError = {fieldName: "id", message: "id already in use"};
                return res.status(400).json(ApiResponseUtils.badRequestResponse([validationError]))
            }
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR))
        });
});

/**
 * Deploy Service by Id
 */
serviceRouter.post("/deploy/:id", hasAdminRole, validateIdOnPath(), async (req: Request, res: Response) => {
    serviceService
        .deployService(req.params.id)
        .then(result => res.status(200).json(ApiResponseUtils.successResponse(result)))
        .catch(error => {
            if (error === ApiErrorType.NOT_FOUND) {
                return res.status(404).json(ApiResponseUtils.errorResponse(ApiResponseMessage.NOT_FOUND))
            }
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR));
        });
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
                return res.status(404).json(ApiResponseUtils.errorResponse(ApiResponseMessage.NOT_FOUND))
            }
            res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR));
        });
});

/**
 * Get Services.
 * query param: sort (optional, values [CREATION_TIME, IMAGE])
 */
serviceRouter.get("/", validateGetServicesRequest(), async (req: Request, res: Response) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const validationErrors: ApiValidationError[] = ApiResponseUtils.mapToApiValidationError(errors.array());
        return res.status(400).json(ApiResponseUtils.badRequestResponse(validationErrors));
    }

    serviceService
        .getServices(req.query.sort)
        .then(result => res.status(200).json(ApiResponseUtils.successResponse(result)))
        .catch(error => res.status(500).json(ApiResponseUtils.errorResponse(ApiResponseMessage.UNEXPECTED_ERROR)));
});

function validateIdOnPath() {
    return [
        param("id").notEmpty()
    ];
}

function validateGetServicesRequest() {
    return [
        query("sort").optional().isIn(Object.values(SortServicesBy))
    ];
}

function validateCreateServiceRequest() {
    return [
        body("id").notEmpty(),
        body("image").notEmpty(),
        body("type").notEmpty().isIn([ServiceType.Deployment, ServiceType.StatefulSet]),
        body("createdAt").notEmpty(),
        body("cpu").optional().isInt().isIn([1, 2, 3]),
        body("memory").optional().isInt(),
        body("deploymentStatus").not().exists()
    ]
}
