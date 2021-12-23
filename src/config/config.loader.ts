import * as dotenv from "dotenv";

class ConfigLoader {

    private jwtTokenPrivateKey: string;

    load() {
        dotenv.config();
        this.jwtTokenPrivateKey = this.base64Decode(process.env.JWT_TOKEN_PRIVATE_KEY);
    }

    private base64Decode(text: string): string {
        const buffer = Buffer.from(text, "base64");
        return buffer.toString("utf-8");
    }

    getJwtTokenPrivateKey(): string {
        return this.jwtTokenPrivateKey;
    }

}

const configLoader: ConfigLoader = new ConfigLoader();
export default configLoader;
