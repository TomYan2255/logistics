import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { Container, Header, Content, List, ListItem, Text, Button, Icon, Left, Body, Right, Title, Card, CardItem, Footer, FooterTab, Item, Grid, Row, Badge } from 'native-base';
import AppCore from "../../helpers/core.service";
import UserService from '../../helpers/user.service';
import AlertHelper from '../../helpers/alert.helper';
import { ScanEvent, ScanEventType, Location, ScanEventExceptionType } from '../../domain/core';
import ColorConfig from '../../config/color.config';
import QRCodeScanner from 'react-native-qrcode-scanner';
import autobind from 'class-autobind';
import Parse from 'parse/react-native';
import { ConfigKeys } from '../../domain/storage';

interface Props {
    navigation: any;
    packageLimit: number;
}
interface State {
    locationObj: Location;
    activeFooterIndex: number;
    currentOrder?: ScanEvent;
    currentPackage: ScanEvent[];
    scannedPackage: PackageQRCode[]; // 紀錄已掃描過的箱子QRCode
}

interface PackageQRCode {
    manufactureOrder: string; // 製令單號
    quantity: number;
    sequenceNo: string;
}

export default class ScanMain extends Component<Props, State> {
    static defaultProps = {
        packageLimit: 128
    }

    constructor(props) {
        super(props);
        autobind(this);

        this.state = {
            locationObj: this.props.navigation.state.params.locationObj,
            activeFooterIndex: 1,
            currentPackage: [],
            scannedPackage: []
        };

        AppCore.getStorage(ConfigKeys.scanEvent)
            .then(result => console.log(result))
    }

    render() {
        return (
            <Container style={styles.baseContainer}>
                <Header style={styles.header}>
                    <Left>
                        <Button
                            transparent
                            onPress={() => this.props.navigation.goBack()}>
                            <Icon name='ios-arrow-back' />
                        </Button>
                    </Left>
                    <Body>
                        <Title>Scan</Title>
                    </Body>
                    <Right>
                        <Button badge
                            transparent
                            onPress={() => this.clickLocalOrder()}>
                            {/* {AppCore.getLocalOrderCount() > 0 && <Badge><Text>{AppCore.getLocalOrderCount()}</Text></Badge>} */}
                            <Icon style={{ fontSize: 30 }} name='cloud-upload' />
                        </Button>
                    </Right>
                </Header>
                <Content style={{ flex: 1 }}
                    contentContainerStyle={{ flex: 1 }}
                    scrollEnabled={false}>
                    <Item style={styles.infoCard}>
                        <Body style={styles.infoCardBody}>
                            <Text>Location: {this.state.locationObj.name}</Text>
                            <Text note>Order No: {this.state.currentOrder ? this.state.currentOrder.scanData : ''}</Text>
                            <Text note>Package Qty: {this.state.currentPackage.length}</Text>
                        </Body>
                        <Right>
                            <Button
                                transparent
                                onPress={() => this.clickRecord()}>
                                <Icon style={styles.infoCardIcon} name='list' />
                            </Button>
                        </Right>
                    </Item>
                    {/* <Card style={styles.infoCard}>
                        <CardItem cardBody>
                            <Body>
                                
                            </Body>
                            <Right>
                                <Button
                                    transparent
                                    onPress={() => this.clickRecord()}>
                                    <Icon style={styles.infoCardIcon} name='list' />
                                </Button>
                            </Right>
                        </CardItem>
                    </Card> */}
                    <Item style={styles.scanScreen}>
                        <QRCodeScanner
                            onRead={this.onScanSuccess}
                            // cameraStyle={{alignSelf: 'center', width: 310, height: 310}}
                            showMarker={true}
                            reactivate={true}
                            reactivateTimeout={2000}
                        />
                    </Item>
                </Content>
                <Footer>
                    <FooterTab style={styles.footerContainer}>
                        <Button style={styles.footerButton}
                            active={this.state.activeFooterIndex === 1}
                            onPress={this.clickOrder}>
                            <Text style={[styles.footerButtonText, this.state.activeFooterIndex === 1 && styles.footerActiveButtonText]}>Order</Text>
                        </Button>
                        <Icon style={styles.footerArrow} name='md-arrow-dropright' />
                        <Button style={styles.footerButton}
                            active={this.state.activeFooterIndex === 2}>
                            <Text style={[styles.footerButtonText, this.state.activeFooterIndex === 2 && styles.footerActiveButtonText]}>Package</Text>
                        </Button>
                        <Icon style={styles.footerArrow} name='md-arrow-dropright' />
                        <Button style={styles.footerButton}
                            active={this.state.activeFooterIndex === 3}
                            onPress={this.clickSubmit}>
                            <Text style={[styles.footerButtonText, this.state.activeFooterIndex === 3 && styles.footerActiveButtonText]}>Submit</Text>
                        </Button>
                    </FooterTab>
                </Footer>
            </Container>
        );
    }

    onScanSuccess(e) {
        switch (this.state.activeFooterIndex) {
            case 1: this.scanOrder(e.data); break;
            case 2: this.scanPackage(e.data); break;
        }
    }

    scanOrder(scanData: string) {
        this.setState({ currentOrder: this.newScanEvent({ type: ScanEventType.ORDER, scanData: scanData }), activeFooterIndex: 2 });
    }

    scanPackage(scanData: string) {
        const seq = scanData.split('|'); // 拆解製令QRCode
        if (seq.length === 3 && this.state.currentPackage.length < this.props.packageLimit) {

            const newPkg: PackageQRCode = {
                manufactureOrder: seq[0],
                quantity: Number(seq[1]),
                sequenceNo: seq[2]
            };

            // If scan the same QRCode, display toast alert and skip it
            if (this.state.scannedPackage.some(x => x.sequenceNo === newPkg.sequenceNo)) {
                AlertHelper.displayToast('This QRCode has been scanned.');
                return;
            }

            const newScan = this.newScanEvent({ type: ScanEventType.GOODS, parent: this.state.currentOrder, scanData: scanData });
            const currentPackageTemp = this.state.currentPackage.slice();
            currentPackageTemp.push(newScan);

            const scannedPackageTemp = this.state.scannedPackage.slice();
            scannedPackageTemp.push(newPkg);

            this.setState({ currentPackage: currentPackageTemp, scannedPackage: scannedPackageTemp });
        }
    }

    newScanEvent(args: { type?: string, parent?: ScanEvent, scanData?: string }) {
        const result = new ScanEvent();
        result.user = UserService.currentUser;
        result.type = args.type;
        result.parent = args.parent;
        result.location = this.state.locationObj;
        result.scanAt = new Date();
        result.status = undefined;
        result.scanData = args.scanData;
        return result;
    }

    resetCurrentOrder() {
        this.setState({ currentOrder: undefined, currentPackage: [], scannedPackage: [], activeFooterIndex: 1 });
    }

    clickOrder() {
        if (this.state.activeFooterIndex > 1) {
            AlertHelper.alertObj.alert(
                'Alert Message',
                'Do you wish to cancel current order?',
                [
                    { text: 'Yes', onPress: this.submitCancelRecord },
                    { text: 'Cancel', onPress: null }
                ],
                { cancelable: false }
            )
        }
    }

    clickRecord() {
        const errorMsg = this.checkScanError();
        if (errorMsg.length > 0) {
            AlertHelper.alertError(errorMsg);
        } else {

            this.props.navigation.navigate('ScanRecord', { currentOrder: this.state.currentOrder, currentPackage: this.state.currentPackage });
        }
    }

    clickSubmit() {
        const errorMsg = this.checkScanError();
        if (errorMsg.length > 0) {
            AlertHelper.alertError(errorMsg);
        } else {
            AlertHelper.alertObj.alert(
                'Alert Message',
                'Ready to submit?',
                [
                    { text: 'Yes', onPress: () => this.submitCompleteRecord() },
                    { text: 'Cancel', onPress: null }
                ],
                { cancelable: false }
            )
        }
    }

    clickLocalOrder() {
        if (AppCore.getLocalOrderCount() > 0) {
            AlertHelper.alertObj.alert(
                'Alert Message',
                'Try to submit all local order?',
                [
                    { text: 'Yes', onPress: () => AppCore.submitCurrentScanEvent() },
                    { text: 'Cancel', onPress: null }
                ],
                { cancelable: false }
            )
        } else {
            AlertHelper.alertError('No local scan event.');
        }
    }

    // 一般完成submit操作
    submitCompleteRecord() {
        this.insertCompleteEvent();
        this.submitRecord()
    }

    // 取消order操作
    submitCancelRecord() {
        if (this.state.currentOrder) {
            const tempOrder = this.state.currentOrder;
            tempOrder.status = ScanEventExceptionType.CANCEL_PACKAGING;
            this.setState({ currentOrder: tempOrder });
            this.insertCancelEvent();
            this.submitRecord();
        }
    }

    submitRecord() {
        let submitScanEvents = [];
        submitScanEvents.push(this.state.currentOrder);
        submitScanEvents = submitScanEvents.concat(this.state.currentPackage);

        AppCore.submitCurrentScanEvent(submitScanEvents);
        this.resetCurrentOrder();
    }

    /** 在一般完成狀況下，額外新增完成event */
    insertCompleteEvent() {
        if (!this.state.currentPackage.some(x => x.type === ScanEventType.COMPLETE)) {
            const completeEvent = this.newScanEvent({ type: ScanEventType.COMPLETE, parent: this.state.currentOrder });
            const currentPackageTemp = this.state.currentPackage.slice();
            currentPackageTemp.push(completeEvent);
            this.setState({ currentPackage: currentPackageTemp, activeFooterIndex: 3 });
        }
    }

    insertCancelEvent() {
        if (!this.state.currentPackage.some(x => x.type === ScanEventType.CANCEL)) {
            const cancelEvent = this.newScanEvent({ type: ScanEventType.CANCEL, parent: this.state.currentOrder });
            const currentPackageTemp = this.state.currentPackage.slice();
            currentPackageTemp.push(cancelEvent);
            this.setState({ currentPackage: currentPackageTemp, activeFooterIndex: 3 });
        }
    }

    /** 檢查目前是否有order及package, 使用在UI點擊submit或觀看已掃描清單 */
    checkScanError(): string {
        const result = [];
        if (!this.state.currentOrder) {
            result.push('Please scan order first.');
        }
        if (!this.state.currentPackage || this.state.currentPackage.length === 0) {
            result.push('No package scanned.')
        }
        return result.join('\n');
    }
}

const styles = StyleSheet.create({
    baseContainer: {
        backgroundColor: ColorConfig.GRAY_BACKGROUND
    },
    header: {
        backgroundColor: ColorConfig.GRAY_HEADER_BACKGROUND
    },
    infoCard: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: ColorConfig.WHITE
    },
    infoCardBody: {
        alignItems: 'flex-start',
    },
    infoCardIcon: {
        color: ColorConfig.GRAY_BUTTON_BACKGROUND,
        fontSize: 30
    },
    scanScreen: {
        flex: 6,
        backgroundColor: 'rgba(255, 255, 255, 0)'
    },
    footerContainer: {
        alignItems: 'center',
        backgroundColor: ColorConfig.GRAY_BUTTON_BACKGROUND
    },
    footerArrow: {
        color: ColorConfig.YELLOW_MAIN_THEME
    },
    footerButton: {
        backgroundColor: ColorConfig.TRANSPARENT
    },
    footerButtonText: {
        color: ColorConfig.WHITE
    },
    footerActiveButtonText: {
        color: ColorConfig.YELLOW_MAIN_THEME
    }
});