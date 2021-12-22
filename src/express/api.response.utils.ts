import {ApiResponse, ApiResponseMessages} from "../service/error.interface";
import {v4 as uuid} from "uuid";

export class ApiResponseUtils {

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
