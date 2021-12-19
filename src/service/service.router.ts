import express, {Request, Response} from "express";
import {ServiceService} from "./service.service";

export const serviceRouter = express.Router();
const serviceService = new ServiceService();

serviceRouter.get("/", async (req: Request, res: Response) => {
    serviceService
        .getServices()
        .then(result => res.status(200).json(result))
        .catch(error => res.status(500));
});
