export enum ApiErrorType {
    NOT_FOUND = "NOT_FOUND",
    DB_ERROR = "DB_ERROR",
    ID_IN_USE = "ID_IN_USE",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    INVALID_JWT_TOKEN = "INVALID_JWT_TOKEN",
    TOKEN_NOT_PROVIDED = "TOKEN_NOT_PROVIDED"
}

export interface ApiValidationError {
    fieldName: string;
    message: string;
}

export enum ApiResponseMessage {
    SUCCESS = "Success",
    BAD_REQUEST = "Bad Request",
    NOT_FOUND = "Not Found",
    UNAUTHORIZED = "You must be logged in to acces this resource",
    JWT_TOKEN_INVALID_EXPIRED = "Jwt token is invalid or expired",
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
