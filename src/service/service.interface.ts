export enum ServiceType {
    Deployment = 'Deployment',
    StatefulSet = 'StatefulSet'
}

export enum DeploymentStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
}

export interface Service {
    id: string;
    image: string;
    type: ServiceType;
    createdAt: string;
    cpu?: number;
    memory?: number
    deploymentStatus?: DeploymentStatus
}

export interface ServiceMongo {
    _id: string;
    image: string;
    type: ServiceType;
    createdAt: string;
    cpu?: number;
    memory?: number
}
