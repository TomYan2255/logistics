import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { Container, Header, Left, Body, Right, Button, Icon, Title, Content, List, ListItem, Text, Card, CardItem, Item } from 'native-base';
import { ScanEvent } from '../../domain/core';
import Parse from 'parse/react-native';
import ColorConfig from '../../config/color.config';

interface Props {
    navigation: any;
}
interface State {
    currentOrder: ScanEvent;
    currentPackage: ScanEvent[];
}

export default class ScanRecord extends Component<Props, State> {

    constructor(props) {
        super(props);

        this.state = {
            currentOrder: this.props.navigation.state.params.currentOrder,
            currentPackage: this.props.navigation.state.params.currentPackage
        }

        console.log(this.state.currentOrder);
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
                        <Title>Scan Record</Title>
                    </Body>
                    <Right />
                </Header>
                <Content style={{ flex: 1 }}
                    contentContainerStyle={{ flex: 1 }}
                    scrollEnabled={false}>
                    <Item style={styles.infoCard}>
                        <Text>Location: {this.state.currentOrder.location.name}</Text>
                        {this.state.currentOrder && <Text note>Order No: {this.state.currentOrder.scanData}</Text>}
                        {this.state.currentPackage.length > 0 && <Text note>Package Qty: {this.state.currentPackage.length}</Text>}
                    </Item>
                    <List
                        dataArray={this.state.currentPackage}
                        renderRow={(item) =>
                            <Card>
                                <CardItem>
                                    <Body>
                                        <Text>Mfg. No.: {item.scanData}</Text>
                                        <Text note>Scan Time: {item.scanAt.toLocaleString()}</Text>
                                    </Body>
                                </CardItem>
                            </Card>
                        }>
                    </List>
                </Content>
            </Container >
        );
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
        backgroundColor: ColorConfig.WHITE,
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingLeft: 10,
        paddingRight: 10
    }
});