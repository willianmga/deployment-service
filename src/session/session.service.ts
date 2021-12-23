import {v4 as uuid} from "uuid";
import {LoginRequest, Session, SessionDetails, SessionStatus} from "./session.interfaces";
import {MongoUserRepository} from "../user/mongo.user.repository";
import {ApiErrorType} from "../service/error.interface";
import {JwtTokenService, SESSION_DURATION_IN_SECONDS} from "./jwt.token.service";
import {JwtTokenDetails} from "./jwt.interfaces";
import {User} from "../user/user.interfaces";
import {MongoSessionRepository} from "./mongo.session.repository";
import {HashService} from "./hash.service";

export class SessionService {

    private jwtService: JwtTokenService;
    private hashService: HashService;
    private userRepository: MongoUserRepository;
    private sessionRepository: MongoSessionRepository;

    constructor() {
        this.jwtService = new JwtTokenService();
        this.hashService = new HashService();
        this.userRepository = new MongoUserRepository();
        this.sessionRepository = new MongoSessionRepository();
    }

    async login(loginRequest: LoginRequest): Promise<JwtTokenDetails> {
        return new Promise<JwtTokenDetails>((resolve, reject) => {
            this.userRepository.findUserByUsername(loginRequest.username)
                .then((user: User) => {
                    if (this.hashService.hash(loginRequest.password) === user.password) {
                        return this.sessionRepository.insertSession(this.createSession(user));
                    }
                    reject(ApiErrorType.INVALID_CREDENTIALS);
                })
                .then(session => resolve(this.jwtService.generateJwtToken(session)))
                .catch(error => {
                    if (error === ApiErrorType.NOT_FOUND) {
                        reject(ApiErrorType.INVALID_CREDENTIALS);
                    } else {
                        reject(error);
                    }
                });
        });
    }

    async logout(sessionDetails: SessionDetails): Promise<void> {
        return this.sessionRepository.invalidateSession(sessionDetails.sessionId);
    }

    private createSession(user: User): Session {

        const expirationDate: number = Math.floor(Date.now() / 1000) + SESSION_DURATION_IN_SECONDS;

        return {
            id: uuid(),
            userId: user.id,
            status: SessionStatus.ACTIVE,
            createdDate: Date.now().toString(),
            expirationDate: expirationDate.toString()
        }
    }

}
