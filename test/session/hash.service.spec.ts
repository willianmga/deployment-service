import {describe} from "mocha";
import {expect} from "chai";
import {HashService} from "../../src/session/hash.service";

describe("Hash Service tests", () => {

    it("should hash string using sha256 algorithm", () => {
        const hashService: HashService = new HashService();

        expect(hashService.hash("strongpassword")).to.equal("05926fd3e6ec8c13c5da5205b546037bdcf861528e0bdb22e9cece29e567a1bc");
    });

});
