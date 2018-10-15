import { Alert, EventEmitter, AsyncStorage, AppState, NetInfo } from "react-native";
import Storage from 'react-native-storage';
import moment from 'moment';
var Parse = require('parse/react-native');
// import * as Parse from 'parse/react-native';
import _ from 'lodash';
import { ParseConfig, DataTables } from "../config/parse.config";
import { Location, ScanEvent, ScanEventType, IScanEvent, LocationChannel, ScanEventVideo, IExportVideo, Configuration, INvrServerConfig } from '../domain/core';
import { ConfigKeys, LocalScanEvent } from '../domain/storage';
import userService from "./user.service";
import alertHelper from "./alert.helper";
import * as uuid from 'uuid';

class AppCore {

    serverUrl: string;
    storage: Storage = null;
    currentScanEvents: ScanEvent[];
    localScanEvents: LocalScanEvent[]; // 存放所有local資料
    locations: Location[];
    exportVideoConfig: Configuration;

    constructor() {
        this.storage = new Storage({
            storageBackend: AsyncStorage,
            defaultExpires: null,
            enableCache: true,
        });

        this.currentScanEvents = [];

        this.getStorage(ConfigKeys.scanEvent)
            .then(result => this.localScanEvents = result ? result : [])
            .catch(err => this.localScanEvents = []);
    }

    initParse(args?: { ip?: string, port?: string }) {
        this.serverUrl = this.getServerUrl(args.ip, args.port);

        Parse.initialize(ParseConfig.APPLICATION_ID, '');
        // Parse.masterKey = ParseConfig.MASTER_KEY;
        // Parse.serverURL = url;

        // Parse.Object.registerSubclass('Location', Location);
        // Parse.Object.registerSubclass('LocationChannel', LocationChannel);
        // Parse.Object.registerSubclass('ScanEvent', ScanEvent);

        Parse[`${'masterKey'}`] = ParseConfig.MASTER_KEY;
        Parse[`${'serverURL'}`] = this.serverUrl + ParseConfig.PARSE_URL;

        Parse.Object.registerSubclass('Location', Location);
        Parse.Object.registerSubclass('LocationChannel', LocationChannel);
        Parse.Object.registerSubclass('ScanEvent', ScanEvent);
        Parse.Object.registerSubclass('ScanEventVideo', ScanEventVideo);

        // 避免上次未正常登出，造成Init Parse Server後Parse.User.Current會cache住前一個User，故呼叫一次登出
        Parse.User.logOut();
    }

    getServerUrl(ip: string, port?: string) {
        return (ParseConfig.URL_TEMPLATE)
            .replace('{protocol}', ParseConfig.PROTOCOL)
            .replace('{ip}', ip)
            .replace('{port}', port ? ':' + port : '');
    }

    getStorage(key: string) {
        return this.storage.load({ key: key });
    }

    setStorage(key: string, data: any) {
        this.storage.save({ key: key, data: data });
    }

    fetchConfiguration() {
        const query = new Parse.Query(DataTables.Configuration);
        query.equalTo('key', 'NVR');
        return query.find().then((results) => results.map((result) => new Configuration(result)));
    }

    fetchLocations(filter?) {
        const query = new Parse.Query(DataTables.Location);
        if (filter) {
            filter(query);
        }
        return query.find().then((results) => results.map((result) => new Location(result)));
    }

    /** 檢查連線狀態並上傳當前User所有現在掃描及先前的local scan event */
    submitCurrentScanEvent(newEvents?: ScanEvent[]) {
        this.currentScanEvents = [];
        if (newEvents) {
            this.currentScanEvents = this.currentScanEvents.concat(newEvents);
        }
        NetInfo.getConnectionInfo().then((connectionInfo) => {
            if (connectionInfo.type !== 'none' && connectionInfo.type !== 'unknown') {
                this.currentScanEvents = this.currentScanEvents.concat(this.getLocalScanEvent(true));
                if (this.currentScanEvents.length > 0) {
                    Parse.Object.saveAll(this.currentScanEvents)
                        .then(() => this.submitScanEventVideo())
                        .catch((err) => {
                            console.log(err);
                            this.saveLocalScanEvent();
                        });
                }
            } else {
                alertHelper.displayToast('Please check network connection.');
                this.saveLocalScanEvent();
            }
        })
    }

    /** 送出ScanEvent之後呼叫，直接送出ScanEventVideo資料 */
    submitScanEventVideo() {
        const orderEvents = this.currentScanEvents.filter(x => x.type === ScanEventType.ORDER);
        orderEvents.forEach(order => {
            const submitData = [];
            const query = new Parse.Query(DataTables.LocationChannel)
                .matchesQuery('location', new Parse.Query(DataTables.Location).equalTo('objectId', order.location['id']));
            query.include('location').find().then(results => {
                results.map((result) => {
                    submitData.push(this.newScanEventVideo({ orderEvent: order, channel: result }));
                });
                Parse.Object.saveAll(submitData)
                    .then(() => this.submitExportVideo(submitData))
                    .catch((err) => console.log(err.message));
            }).catch((err) => console.log(err.message));
        });
    }

    /** 取得轉檔Server config後，固定間隔送出轉檔Post */
    submitExportVideo(datas: ScanEventVideo[]) {
        this.fetchConfiguration().then(results => {
            const config = results[0].value;
            let timeout = 500;
            for (let i = 0; i < datas.length; i++) {
                setTimeout(() => {
                    this.fetchExportVideoPost(datas[i], config);
                }, (timeout * i));
            }
        }).catch(err => alertHelper.alertError(err.message));
    }

    /** 送出Post告知Server進行轉檔 */
    fetchExportVideoPost(data: ScanEventVideo, config: INvrServerConfig) {
        const obj: IExportVideo = {
            scanEventId: data.event['id'],
            channel: data.channel.nvrChannelNo,
            ip: config.serverIp,
            port: config.serverPort,
            user: config.serverAccount,
            password: config.serverPassword,
            isHttps: config.isHttps,
            beginTime: +moment(data.event.scanAt),
            endTime: +moment(this.findLastScanEventTime(data.event))
        };
        fetch(this.serverUrl + ParseConfig.EXPORT_VIDEO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
    }

    /** 取得同order下最後scan時間 */
    findLastScanEventTime(parent: ScanEvent) {
        const childEvents = this.currentScanEvents.filter(x => x.parent === parent);
        if (childEvents.length === 0) {
            return parent.scanAt;
        }
        return _.maxBy(childEvents, function (o) { return o.scanAt; }).scanAt;
    }

    newScanEventVideo(args: { orderEvent?: ScanEvent, channel?: LocationChannel }) {
        const result = new ScanEventVideo();
        result.event = args.orderEvent;
        result.channel = args.channel;
        result.url = undefined;
        return result;
    }

    /** 從local storage取得當前user的未上傳資料，參數決定轉換為ParseObject後是否直接從local刪除 */
    getLocalScanEvent(deleteData: boolean = false): ScanEvent[] {
        const result: ScanEvent[] = [];

        const currentUserLocalData = this.localScanEvents.filter(x => x.user === userService.currentUser.id);
        currentUserLocalData.filter(x => x.type === ScanEventType.ORDER).forEach(parentItem => {
            const parentParseObj = this.convertLocalEventToParseScan({ item: parentItem });
            result.push(parentParseObj);

            currentUserLocalData.filter(child => child.parent === parentItem.id).forEach(childItem => {
                result.push(this.convertLocalEventToParseScan({ item: childItem, parent: parentParseObj }));
            });
        });

        // 把local storage中所有當前User的Scan資料移除
        if (deleteData) {
            this.localScanEvents = _.difference(this.localScanEvents,
                this.localScanEvents.filter(x => x.user === userService.currentUser.id));
            this.setStorage(ConfigKeys.scanEvent, this.localScanEvents);
        }

        return result;
    }

    /** 在Submit失敗時，將this.currentScanEvents的資料轉換後儲存到local */
    saveLocalScanEvent() {
        this.currentScanEvents.filter(x => x.type === ScanEventType.ORDER).forEach(element => {
            const newLocalOrder = this.convertParseScanEventToLocal({ item: element });
            this.localScanEvents.push(newLocalOrder);

            this.currentScanEvents.filter(item => item.parent === element).forEach(child => {
                this.localScanEvents.push(this.convertParseScanEventToLocal({ item: child, parentId: newLocalOrder.id }));
            });
        });

        this.setStorage(ConfigKeys.scanEvent, this.localScanEvents);
        this.currentScanEvents = [];
    }

    /** 將Parse的ScanEvent轉換為local物件 */
    convertParseScanEventToLocal(args: { item: ScanEvent, parentId?: string }): LocalScanEvent {
        return {
            id: uuid.v1(),
            user: args.item.user.id,
            type: args.item.type,
            parent: args.parentId,
            location: args.item.location['id'],
            scanAt: args.item.scanAt,
            status: args.item.status,
            scanData: args.item.scanData
        };
    }

    /** 將local ScanEvent轉換為ParseObject */
    convertLocalEventToParseScan(args: { item: LocalScanEvent, parent?: ScanEvent }): ScanEvent {
        if (args.item.user !== userService.currentUser.id) {
            return undefined;
        }

        const result = new ScanEvent();
        result.user = userService.currentUser;
        result.type = args.item.type;
        result.parent = args.parent;
        result.location = this.locations.find(x => x['id'] === args.item.location);
        result.scanAt = new Date(args.item.scanAt);
        result.status = args.item.status;
        result.scanData = args.item.scanData;
        return result;
    }

    /** 取得當前User未上傳的ScanEvent type=Order的數量 */
    getLocalOrderCount(): number {
        return this.getLocalScanEvent().filter(x => x.type === ScanEventType.ORDER).length;
    }
}

export default new AppCore();