import {NextFunction, Request, Response} from "express";
import {UserRole} from "../user/user.interfaces";
import {ApiResponseUtils} from "./api.response.utils";
import {ApiResponseMessage} from "../service/error.interface";

export const hasAdminRole = (req: Request, res: Response, next: NextFunction) => {
    checkUserRoleMiddleware(req, res, next, [UserRole.ADMIN]);
}

export const hasContributorOrHigherRole = (req: Request, res: Response, next: NextFunction) => {
    checkUserRoleMiddleware(req, res, next, [UserRole.ADMIN, UserRole.CONTRIBUTOR]);
}

function checkUserRoleMiddleware(req: Request, res: Response, next: NextFunction, userRoles: UserRole[]) {
    if (userRoles.includes(req.sessionDetails.userRole)) {
        next();
    } else {
        return res.status(403).json(ApiResponseUtils.errorResponse(ApiResponseMessage.FORBIDDEN));
    }

}
