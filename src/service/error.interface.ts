export enum ValidationErrorType {
    VALUE_CANNOT_BE_NULL = "VALUE_CANNOT_BE_NULL",
    VALUE_OUT_OF_FORMAT = "VALUE_OUT_OF_FORMAT",
    NUMBER_OUT_OF_RANGE = "NUMBER_OUT_OF_RANGE"
}

export interface ValidationError {
    fieldName: string;
    errorType: ValidationErrorType
}

export interface RequestError {
    message: string;
    errors: any[]
}
