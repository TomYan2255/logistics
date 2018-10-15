import React, { Component } from 'react';
import { StatusBar, ListViewDataSource, ListView, StyleSheet, BackHandler } from "react-native";
import { Container, Header, Content, List, ListItem, Text, Left, Right, Button, Icon, Body, Title, Item, Input, Grid, Col, Spinner, Card, CardItem } from 'native-base';

import ColorConfig from '../../config/color.config';
import { Location } from '../../domain/core';
import AppCore from '../../helpers/core.service';
import AlertHelper from '../../helpers/alert.helper';

interface Props {
    navigation: any;
}

interface State {
    loading: boolean;
    dataSource: Location[];
    searchKey: string;
}

export default class SelectLocation extends Component<Props, State> {

    componentDidMount() {
        this.getLocations();
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    }

    handleBackButton(): boolean {
        // AlertHelper.alertObj.alert(
        //     'Alert Message',
        //     'Do you wish to exit this app?',
        //     [
        //         { text: 'Yes', onPress: BackHandler.exitApp },
        //         { text: 'Cancel', onPress: null }
        //     ],
        //     { cancelable: false }
        // );

        return true;
    }

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            dataSource: [],
            searchKey: ''
        }
    }

    render() {
        const { navigate } = this.props.navigation;
        return (
            <Container>
                <Header style={styles.header}>
                    <Left>
                        <Button
                            transparent
                            onPress={() => this.props.navigation.navigate('DrawerOpen')}>
                            <Icon name='menu' />
                        </Button>
                    </Left>
                    <Body>
                        <Title>Select Location</Title>
                    </Body>
                    <Right />
                </Header>
                <Content style={styles.content}
                    contentContainerStyle={{ flex: 1 }}
                    scrollEnabled={false}>
                    <Item regular style={styles.searchBar}>
                        <Input
                            placeholder='Search'
                            onChangeText={(searchKey) => this.setState({ searchKey })}
                            value={this.state.searchKey} />
                    </Item>
                    {!this.state.loading && <List
                        dataArray={this.getFiltedLocations()}
                        renderRow={(item) =>
                            <Button block style={styles.locationButton}
                                onPress={() => navigate('ScanMain', { locationObj: item })}>
                                <Text>{item.name}</Text>
                            </Button>
                        }>
                    </List>}
                    {this.state.loading && <Spinner color='#565656' />}
                </Content>
            </Container>
        );
    }

    getLocations() {
        this.setState({ loading: true });
        AppCore.fetchLocations()
            .then((results) => this.setState({ dataSource: results, loading: false }))
            .then(() => AppCore.locations = this.state.dataSource)
            .catch((error) => AlertHelper.alertError(error.message));
    }

    getFiltedLocations() {
        if (this.state.searchKey.length === 0) {
            return this.state.dataSource;
        }

        return this.state.dataSource.filter(x => x.name.toLowerCase().indexOf(this.state.searchKey.toLowerCase()) >= 0);
    }
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: ColorConfig.GRAY_HEADER_BACKGROUND
    },
    content: {
        flex: 1,
        padding: 5,
        backgroundColor: ColorConfig.GRAY_BACKGROUND
    },
    searchBar: {
        backgroundColor: ColorConfig.GRAY_INPUT_BACKGROUND,
        borderColor: ColorConfig.GRAY_INPUT_BACKGROUND,
        borderRadius: 5,
        marginBottom: 10
    },
    searchIcon: {
        fontSize: 24,
        color: ColorConfig.GRAY_BUTTON_BACKGROUND
    },
    locationButton: {
        marginBottom: 5,
        backgroundColor: ColorConfig.GRAY_BUTTON_BACKGROUND,
        borderColor: ColorConfig.GRAY_BUTTON_BORDER
    }
});