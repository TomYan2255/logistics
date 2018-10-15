import React from 'react';
import { StatusBar, StyleSheet, AppState, BackHandler } from 'react-native';
import { Button, Text, Container, Content, Form, Item, Input, Footer, FooterTab, Header, Left, Body, Right, Title, Spinner } from 'native-base';
import autobind from 'class-autobind';
import ColorConfig from '../../config/color.config';
import UserService from '../../helpers/user.service';
import AlertHelper from '../../helpers/alert.helper';

interface Props {
    navigation: any;
}
interface State {
    useremail: string;
    password: string;
    loading: boolean;
}

export default class Lock extends React.Component<Props, State> {

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    }

    handleBackButton(): boolean {
        return true;
    }

    constructor(props) {
        super(props);
        autobind(this);

        this.state = {
            useremail: '' + UserService.currentUser.attributes.email,
            password: '',
            loading: false
        };
    }

    render() {
        return (
            <Container style={styles.baseContainer}>
                <Content style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContainer}
                    scrollEnabled={false}>
                    <Form style={styles.loginForm}>
                        <Item regular style={styles.regularInput}>
                            <Input
                                placeholder='Email Address'
                                autoCapitalize='none'
                                onChangeText={(useremail) => this.setState({ useremail })}
                                value={this.state.useremail} />
                        </Item>
                        <Item regular style={styles.regularInput}>
                            <Input
                                placeholder='Password'
                                autoCapitalize='none'
                                onChangeText={(password) => this.setState({ password })}
                                value={this.state.password}
                                secureTextEntry={true} />
                        </Item>
                        <Text style={styles.noteText}>Please input current user or administrator's email & password to unlock.</Text>
                        <Item style={styles.loginButtonContainer}>
                            <Button style={styles.loginButton}
                                onPress={this.verifyCurrentUser}>
                                <Text>Unlock</Text>
                            </Button>
                        </Item>
                    </Form>
                    {this.state.loading && <Spinner color='#565656' />}
                </Content>
            </Container>
        );
    }

    verifyCurrentUser() {
        // If email is current user, then check password
        if (this.state.useremail.toLowerCase() === UserService.currentUser.attributes.email.toLowerCase()) {
            if (this.state.password === UserService.currentUserPsw) {
                this.props.navigation.navigate('ScanRoot');
            } else {
                AlertHelper.alertError('Wrong password.');
            }
        } // otherwise, login to check its admin 
        else {
            this.setState({ loading: true });
            UserService.checkUserPermissionByEmail({ email: this.state.useremail.toLowerCase(), password: this.state.password.toLowerCase() })
                .then(() => {
                    this.setState({ loading: false });
                    this.props.navigation.navigate('ScanRoot');
                })
                .catch((error) => {
                    this.setState({ loading: false });
                    AlertHelper.alertError(error.message);
                });
        }
    }
}

const styles = StyleSheet.create({
    baseContainer: {
        backgroundColor: ColorConfig.GRAY_BACKGROUND
    },
    scrollContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginForm: {
        backgroundColor: 'white',
        width: '90%',
        borderRadius: 5,
        padding: 15
    },
    regularInput: {
        backgroundColor: ColorConfig.GRAY_INPUT_BACKGROUND,
        borderColor: ColorConfig.GRAY_INPUT_BACKGROUND,
        borderRadius: 5,
        marginBottom: 10
    },
    loginButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderBottomWidth: 0
    },
    loginButton: {
        backgroundColor: ColorConfig.GRAY_BUTTON_BACKGROUND,
        borderColor: ColorConfig.GRAY_BUTTON_BORDER,
        borderWidth: 1
    },
    noteText: {
        color: ColorConfig.GRAY_NOTE,
        fontSize: 14,
        marginBottom: 10
    }
});