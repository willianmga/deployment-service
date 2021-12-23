export interface JwtTokenDetails {
    token: string;
    expiration: any;
}

export interface ParsedJwtTokenDetails {
    userId: string;
    sessionId: string;
}
