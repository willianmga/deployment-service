import {ApiResponse, ApiValidationError} from "../../src/service/error.interface";
import {expect} from "chai";

export class TestsAssertionUtils {

    static assertValidationErrors(validationErrors: Array<ApiValidationError>,
                                  expectedValidationErrors: Array<ApiValidationError>) {
        expectedValidationErrors.forEach((error, index) => {
            const validationError = validationErrors[index];
            const expectedValidationError = expectedValidationErrors[index];
            expect(validationError.fieldName).to.equal(expectedValidationError.fieldName);
            expect(validationError.message).to.equal(expectedValidationError.message);
        });
    }

    static assertApiResponse(expectedMessage: string, apiResponse: ApiResponse) {
        expect(apiResponse.message).to.equal(expectedMessage);
        expect(apiResponse.transactionId).to.not.empty;
        expect(apiResponse.timestamp).to.not.empty;
    }

}
