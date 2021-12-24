import {SessionDetails} from "../../src/session/session.interfaces";

declare global {
    namespace Express {
        interface Request {
            sessionDetails: SessionDetails
        }
    }
}
