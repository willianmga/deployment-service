import {UserRole} from "../user/user.interfaces";

export interface LoginRequest {
    username: string;
    password: string;
}

export enum SessionStatus {
    ACTIVE = "ACTIVE",
    LOGGED_OFF = "LOGGED_OFF"
}

export interface Session {
    id: string;
    userId: string;
    status: SessionStatus;
    createdDate: string;
    expirationDate: string;
}

export interface SessionMongo {
    _id: string;
    userId: string;
    status: SessionStatus;
    createdDate: string;
    expirationDate: string;
}

export interface SessionDetails {
    sessionId: string;
    userId: string;
    username: string;
    userRole: UserRole
}
