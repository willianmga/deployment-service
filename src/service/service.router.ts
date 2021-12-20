import express, {Request, Response} from "express";
import {ServiceService} from "./service.service";
import {body, validationResult} from "express-validator";

export const serviceRouter = express.Router();
const serviceService = new ServiceService();

serviceRouter.post("/", validateCreateServiceRequest(), async (req: Request, res: Response) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    serviceService
        .insertService(req.body)
        .then(result => res.status(201).json(result))
        .catch(error => res.status(500).json(error));
});

serviceRouter.get("/", async (req: Request, res: Response) => {
    serviceService
        .getServices()
        .then(result => res.status(200).json(result))
        .catch(error => res.status(500));
});

function validateCreateServiceRequest() {
    return [
        body("id").notEmpty(),
        body("image").notEmpty(),
        body("type").not().exists(),
        body("createdAt").notEmpty(),
        body("cpu").optional().isInt().isIn([1, 2, 3]),
        body("memory").optional().isInt()
    ]
}
