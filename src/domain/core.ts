import * as Parse from 'parse/react-native';
// #region Static Value
export class RoleType {
    static ADMINISTRATOR = 'Administrator';
    static AGENT = 'Agent';
}

export class ScanEventType {
    static ORDER = 'Order';
    static GOODS = 'Goods';
    static COMPLETE = 'Complete';
    static CANCEL = 'Cancel';
}

export class ScanEventExceptionType {
    static CHECK_ERROR = 'Check Error';
    static CANCEL_PACKAGING = 'Cancel Packaging';
}

export class ConfigurationKeyType {
    static NVR = 'NVR';
    static GENERAL = 'General';
}
// #endregion

// #region Parse Object
export class ScanEvent extends Parse.Object implements IScanEvent {
    get user(): Parse.User { return super.get('user'); }
    set user(value: Parse.User) { super.set('user', value); }
    get type(): string { return super.get('type'); }
    set type(value: string) { super.set('type', value); }
    get parent(): ScanEvent { return super.get('parent'); }
    set parent(value: ScanEvent) { super.set('parent', value); }
    get location(): Location { return super.get('location'); }
    set location(value: Location) { super.set('location', value); }
    get scanAt(): Date { return super.get('scanAt'); }
    set scanAt(value: Date) { super.set('scanAt', value); }
    get status(): string { return super.get('status'); }
    set status(value: string) { super.set('status', value); }
    get scanData(): string { return super.get('scanData'); }
    set scanData(value: string) { super.set('scanData', value); }
    constructor(value?: Partial<IScanEvent>) {
        super('ScanEvent');
        Object.assign(this, value);
    }
}

export class ScanEventVideo extends Parse.Object implements IScanEventVideo {

    get event(): ScanEvent { return super.get('event'); }
    set event(value: ScanEvent) { super.set('event', value); }
    get channel(): LocationChannel { return super.get('channel'); }
    set channel(value: LocationChannel) { super.set('channel', value); }
    get url(): string { return super.get('url'); }
    set url(value: string) { super.set('url', value); }

    constructor(value?: Partial<IScanEventVideo>) {
        super('ScanEventVideo');
        Object.assign(this, value);
    }
}

export class Location extends Parse.Object implements ILocation {
    get name(): string { return super.get('name'); }
    set name(value: string) { super.set('name', value); }
    get sequence(): number { return super.get('sequence'); }
    set sequence(value: number) { super.set('sequence', value); }
    constructor(value?: Partial<ILocation>) {
        super('Location');
        Object.assign(this, value);
    }
}

export class LocationChannel extends Parse.Object implements ILocationChannel {
    get nvrChannelNo(): string { return super.get('nvrChannelNo'); }
    set nvrChannelNo(value: string) { super.set('nvrChannelNo', value); }
    get streamNo(): string { return super.get('streamNo'); }
    set streamNo(value: string) { super.set('streamNo', value); }
    get location(): Location { return super.get('location'); }
    set location(value: Location) { super.set('location', value); }
    constructor(value?: Partial<ILocationChannel>) {
        super('LocationChannel');
        Object.assign(this, value);
    }
}

export class Configuration extends Parse.Object implements IConfiguration  {
    get key(): string { return super.get('key'); }
    set key(value: string) { super.set('key', value); }
    get value(): any { return super.get('value'); }
    set value(value: any) { super.set('value', value); }
    constructor(value?: Partial<IConfiguration>) {
        super('Configuration');
        Object.assign(this, value);
    }
}
// #endregion

// #region Interface
export interface IScanEvent {
    user: Parse.User;
    type: string;
    parent?: IScanEvent;
    location: ILocation;
    scanAt: Date;
    status: string;
    scanData: string;
}

export interface IScanEventVideo {
    event: IScanEvent,
    channel: ILocationChannel;
    url: string;
}

export interface ILocation {
    name?: string;
    sequence?: number;
}

export interface ILocationChannel {
    nvrChannelNo?: string;
    streamNo?: string;
    location: ILocation;
}

export interface IConfiguration {
    key: string;
    value?: any;
}

export interface INvrServerConfig {
    serverIp?: string;
    serverPort?: number;
    serverAccount?: string;
    serverPassword?: string;
    isHttps?: boolean;
    // serverName?: string;
    // cameraServerName?: string;
}

export interface IGeneralConfig {
    mailServerHost?: string;
    mailServerPort?: number;
    // saveSnapshotPath?: string;
    // saveVideoPath?: string;
    stretchVideo?: boolean;
    displayLocation?: boolean;
}

export interface IExportVideo {
    scanEventId: string;
    channel: string;
    ip: string;
    port: number;
    user: string;
    password: string;
    isHttps: boolean;
    beginTime: number;
    endTime: number;
}
// #endregion
