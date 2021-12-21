export enum ServiceType {
    Deployment = 'Deployment',
    StatefulSet = 'StatefulSet'
}

export interface Service {
    id: string;
    image: string;
    type: ServiceType;
    createdAt: string;
    cpu?: number;
    memory?: number
}

export interface ServiceMongo {
    _id: string;
    image: string;
    type: ServiceType;
    createdAt: string;
    cpu?: number;
    memory?: number
}
