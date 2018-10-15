import React from 'react';
import { DrawerNavigator } from "react-navigation";
import { Root } from 'native-base';

import { Login, ScanRoot } from './views';
import Lock from './views/shared/lock';
import SideBar from "./views/shared/sidebar";

interface Props { }

interface State { }

const Index = DrawerNavigator(
  {
    Login: { 
      screen: Login,
      navigationOptions: ({ navigation }) => ({
        drawerLockMode: 'locked-closed'
      })
    },
    ScanRoot: { screen: ScanRoot },
    Lock: {
      screen: Lock,
      navigationOptions: ({ navigation }) => ({
        drawerLockMode: 'locked-closed'
      })
    }
  },
  {
    contentComponent: props => <SideBar {...props} />
  }
);

export default () => 
  <Root>
    <Index />
  </Root>;