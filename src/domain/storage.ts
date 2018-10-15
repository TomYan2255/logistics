import { IScanEvent } from './core';

export class LocalScanEvent {
    id: string;
    user: string;
    type: string;
    parent: string
    location: string;
    scanAt: Date;
    status: string;
    scanData: string;
}

export interface ILoginConfig {
    ip: string;
    port: string;
    account: string;
}

export const ConfigKeys = {
    login: 'loginConfig',
    scanEvent: 'scanEvent'
}