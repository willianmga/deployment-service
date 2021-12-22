import {ApiValidationError} from "../../src/service/error.interface";
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

}
