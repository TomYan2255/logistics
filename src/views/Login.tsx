import React from 'react';
import { Observable } from 'rxjs/Rx';
import { StatusBar, StyleSheet } from 'react-native';
import { Button, Text, Container, Content, Form, Item, Input, Icon, Left, Body, Right, Label, Header, Title, Spinner, Footer, FooterTab } from 'native-base';
import autobind from 'class-autobind';
import UserService from '../helpers/user.service';
import AppCore from '../helpers/core.service';
import { ILoginConfig, ConfigKeys } from '../domain/storage';
import { ParseConfig } from '../config/parse.config';
import ColorConfig from '../config/color.config';
import AlertHelper from '../helpers/alert.helper';
import StringHelper from '../helpers/string.helper';


// const Parse = require('parse/react-native');

interface Props {
  navigation: any;
}

interface State {
  ip: string;
  port: string;
  account: string;
  password: string;
  loading: boolean;
}

export class Login extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    autobind(this);

    this.state = {
      ip: '',
      port: '',
      account: '',
      password: '',
      loading: false
    };
  }

  componentDidMount() {
    this.getLoginConfig();
  }

  render() {
    return (
      <Container style={styles.baseContainer}>
        <Content style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          scrollEnabled={false}>
          <Text style={styles.title}>Logistics</Text>
          <Form style={styles.loginForm}>
            <Item regular style={styles.regularInput}>
              <Input
                placeholder='IP Address'
                autoCapitalize='none'
                onChangeText={(ip) => this.setState({ ip })}
                value={this.state.ip} />
            </Item>
            <Item regular style={styles.regularInput}>
              <Input
                placeholder='Port'
                autoCapitalize='none'
                onChangeText={(port) => this.setState({ port })}
                value={this.state.port} />
            </Item>
            <Item regular style={styles.regularInput}>
              <Input
                placeholder='Email Address'
                autoCapitalize='none'
                onChangeText={(account) => this.setState({ account })}
                value={this.state.account} />
            </Item>
            <Item regular style={styles.regularInput}>
              <Input
                placeholder='Password'
                autoCapitalize='none'
                onChangeText={(password) => this.setState({ password })}
                value={this.state.password}
                secureTextEntry={true} />
            </Item>
            <Item style={styles.loginButtonContainer}>
              <Button style={styles.loginButton}
                onPress={this.logIn}>
                <Text>Login</Text>
              </Button>
            </Item>
          </Form>
          {this.state.loading && <Spinner color='#565656' />}
        </Content>
        <Footer style={styles.footer}>
          <Text style={styles.footerText}>2017 © Hiwin Copyright Reserved.</Text>
        </Footer>
      </Container>
    );
  }

  getLoginConfig() {
    AppCore.getStorage(ConfigKeys.login)
      .then(config => this.setState({ ip: config.ip, port: config.port, account: config.account }))
      .catch((error) => console.log(error.message));
  }

  logIn() {
    if (this.state.loading) {
      return;
    }
    if (!this.state.port || Number(this.state.port) > 65535 || Number(this.state.port) < 1) {
      AlertHelper.alertError('Please input legal port.');
      return;
    }
    if (StringHelper.isNullOrEmpty(this.state.ip)) {
      AlertHelper.alertError('Please input ip & port before login.');
      return;
    }

    AppCore.initParse({ ip: this.state.ip, port: this.state.port});
    this.saveLoginConfig();
    this.setState({ loading: true });
    UserService.logInByEmail({ email: this.state.account, password: this.state.password })
      .then(() => {
        this.setState({ loading: false });
        this.props.navigation.navigate('ScanRoot');
      })
      .catch((error) => {
        this.setState({ loading: false });
        AlertHelper.alertError(error.message);
      });
  }

  saveLoginConfig() {
    AppCore.setStorage(ConfigKeys.login, {
      ip: this.state.ip,
      port: this.state.port,
      account: this.state.account
    });
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
  title: {
    fontSize: 24,
    color: ColorConfig.GRAY_TITLE,
    marginBottom: 15
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
  footer: {
    borderWidth: 0,
    backgroundColor: ColorConfig.GRAY_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: ColorConfig.GRAY_LABEL,
    fontSize: 16
  }
});