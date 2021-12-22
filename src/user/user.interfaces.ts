export enum UserRole {
    ADMIN = "ADMIN",
    CONTRIBUTOR = "CONTRIBUTOR",
    GUEST = "GUEST"
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export interface User {
    id: string;
    username: string;
    password: string;
    role: UserRole;
    status: UserStatus
}

export interface UserMongo {
    _id: string;
    username: string;
    password: string;
    role: UserRole;
    status: UserStatus
}
