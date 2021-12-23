import * as dotenv from "dotenv";
import {logger} from "../logger";

class ConfigLoader {

    private jwtTokenPrivateKey: string;

    load() {
        dotenv.config();

        if (!process.env.JWT_TOKEN_PRIVATE_KEY) {
            logger.error("Jwt token private key must be provided. Exiting service");
            process.exit(1);
        }

        this.jwtTokenPrivateKey = this.base64Decode(process.env.JWT_TOKEN_PRIVATE_KEY);
    }

    private base64Decode(text: string): string {
        try {
            const buffer = Buffer.from(text, "base64");
            return buffer.toString("utf-8");
        } catch (error) {
            logger.error("Failed to base64 decode string");
            return "";
        }
    }

    getJwtTokenPrivateKey(): string {
        return this.jwtTokenPrivateKey;
    }

}

const configLoader: ConfigLoader = new ConfigLoader();
export default configLoader;
