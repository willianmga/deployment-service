import {ApiResponse, ApiResponseMessages, ApiValidationError} from "../service/error.interface";
import {v4 as uuid} from "uuid";
import {ValidationError} from "express-validator/src/base";

export class ApiResponseUtils {

    static mapToApiValidationError(validationErrors: ValidationError[]): ApiValidationError[] {
        return validationErrors
            .map(error => {return {fieldName: error.param, message: error.msg}});
    }

    static successResponse(data: any): ApiResponse {
        return {
            message: ApiResponseMessages.SUCCESS,
            timestamp: Date.now().toString(),
            transactionId: uuid(),
            response: data
        }
    }

    static badRequestResponse(data: any): ApiResponse {
        return {
            message: ApiResponseMessages.BAD_REQUEST,
            timestamp: Date.now().toString(),
            transactionId: uuid(),
            response: data
        }
    }

    static errorResponse(message: ApiResponseMessages): ApiResponse {
        return {
            message,
            timestamp: Date.now().toString(),
            transactionId: uuid()
        }
    }

}
