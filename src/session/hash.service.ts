import {createHash} from "crypto";

export class HashService {

    hash(password: string): string {
        return createHash("sha256")
            .update(password)
            .digest("hex");
    }

}
