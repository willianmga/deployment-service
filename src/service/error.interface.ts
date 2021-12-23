export enum ApiErrorType {
    NOT_FOUND = "NOT_FOUND",
    DB_ERROR = "DB_ERROR",
    ID_IN_USE = "ID_IN_USE",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    INVALID_JWT_TOKEN = "INVALID_JWT_TOKEN"
}

export interface ApiValidationError {
    fieldName: string;
    message: string;
}

export enum ApiResponseMessages {
    SUCCESS = "Success",
    BAD_REQUEST = "Bad Request",
    NOT_FOUND = "Not Found",
    UNAUTHORIZED = "You must be logged in to acces this resource",
    JWT_TOKEN_EXPIRED = "Jwt token is expired. Obtain a new one through login",
    SESSION_TERMINATED = "Session terminated",
    FORBIDDEN = "You don't have privileges to access this resource",
    UNEXPECTED_ERROR = "Unexpected Error"
}

export interface ApiResponse {
    message: string;
    timestamp: string;
    transactionId: string;
    response?: any
}
