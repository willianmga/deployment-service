import {createHash} from "crypto";

export class HashService {

    hash(text: string): string {
        return createHash("sha256")
            .update(text)
            .digest("hex");
    }

}
