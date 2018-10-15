import React, { Component } from 'react';
import { StatusBar } from "react-native";
import { StackNavigator } from 'react-navigation';
import SelectLocation from './select-location';
import ScanMain from './scan-main';
import ScanRecord from './scan-record';

export const ScanRoot = StackNavigator({
  SelectLocation: { 
    screen: SelectLocation,
    navigationOptions: { 
      header: null
    }
  },
  ScanMain: { 
    screen: ScanMain,
    navigationOptions: { 
      header: null
    }
  },
  ScanRecord: {
    screen: ScanRecord,
    navigationOptions: { 
      header: null
    }
  }
});