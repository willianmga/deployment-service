export enum ApiErrorType {
    NOT_FOUND = "NOT_FOUND",
    DB_ERROR = "DB_ERROR",
    ID_IN_USE = "ID_IN_USE",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
}

export enum ValidationErrorType {
    VALUE_CANNOT_BE_NULL = "VALUE_CANNOT_BE_NULL",
    VALUE_OUT_OF_FORMAT = "VALUE_OUT_OF_FORMAT",
    NUMBER_OUT_OF_RANGE = "NUMBER_OUT_OF_RANGE",
    ID_IN_USE = "ID_IN_USE"
}

export interface ApiValidationError {
    fieldName: string;
    message: string;
}

export enum ApiResponseMessages {
    SUCCESS = "Success",
    BAD_REQUEST = "Bad Request",
    NOT_FOUND = "Not Found",
    UNEXPECTED_ERROR = "Unexpected Error"
}

export interface ApiResponse {
    message: string;
    timestamp: string;
    transactionId: string;
    response?: any
}
