/**
 * @format
 * This is the ExampleMaps Registrar for Alice
 */

import React, { Component } from 'react';
import {
  Image,
  NativeModules,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { createAppContainer, createMaterialTopTabNavigator, createStackNavigator } from 'react-navigation';
import Apps from './src/Apps'
const {AppRegistry, ...MiniDapps} = require('./src/Apps/AppRegistry');
import CameraScreen from './src/AliceCore/Screens/Camera';
import Tokens from './src/AliceCore/Screens/Tokens';
import MapboxGL from '@react-native-mapbox-gl/maps';
import env from './env.json';
MapboxGL.setAccessToken(env.mapbox);

import NavigatorService, {navigate} from './src/AliceUtils/navigationWrapper';
import Icon from "./src/AliceComponents/IconComponent";
import Activity from "./src/AliceCore/Screens/Activity";
import {Settings, Wallet} from './src/AliceSDK/Web3'
import OneSignal from 'react-native-onesignal'; // Import package from node modules
import CodePush from "react-native-code-push";

const challengedPOI = {
  "name":"Cape Cod National Seashore Visitor Center",
  "stake":"0x0",
  "address":"400 Nauset Road, Eastham, Massachusetts 02642, United States",
  "longitude":-69.97270938009024,
  "latitude":41.8372811190784,
  "description":"National Park Office and National Seashore Museum with trailheads leading to the marshlands of the national seashore.  ",
  "tags":["Government", "Attraction"],
  "phone":"(508) 255-3421",
  "web":"nps.gov",
  "owner":"0x09527e337f3cccc1bd688037a66b8516b319e31d",
  "loading":false
};

GLOBAL.XMLHttpRequest = GLOBAL.originalXMLHttpRequest || GLOBAL.XMLHttpRequest;

const AppTabNavigator = createMaterialTopTabNavigator({
  // Home: {
  //   screen: CameraScreen,
  //   navigationOptions: {
  //     tabBarLabel: 'Home',
  //     tabBarIcon: ({ focused }) => (
  //       focused ? <Image source={require('./src2/AliceAssets/cam-icon-black.png')} style={{resizeMode: 'contain', width: 40}}/>
  //         : <Image source={require('./src2/AliceAssets/cam-icon-grey.png')} style={{resizeMode: 'contain', width: 40}}/>
  //     )
  //   }
  // },
  Apps: {
    screen: Apps,
    navigationOptions: {
      tabBarLabel: 'Home',
      tabBarIcon: ({ focused }) => (
        focused ? <Image source={require('./src/AliceAssets/dapps-icon-black.png')} style={{resizeMode: 'contain', width: 40}}/>
          : <Image source={require('./src/AliceAssets/dapps-icon-grey.png')} style={{resizeMode: 'contain', width: 40}}/>
      )
    }
  },
  Tokens: {
    screen: Tokens,
    navigationOptions: {
      tabBarLabel: 'Tokens',
      tabBarIcon: ({ focused }) => (
        focused ? <Image source={require('./src/AliceAssets/tokens-icon-black.png')} style={{resizeMode: 'contain', width: 40}}/>
        : <Image source={require('./src/AliceAssets/tokens-icon-grey.png')} style={{resizeMode: 'contain', width: 40}}/>
      )
    }
  },
  Activity: {
    screen: Activity,
    navigationOptions: {
      tabBarLabel: 'Settings',
      tabBarIcon: ({ focused }) => (
        focused ? <Image source={require('./src/AliceAssets/activity-icon-black.png')} style={{resizeMode: 'contain', width: 40}}/>
          : <Image source={require('./src/AliceAssets/activity-icon-grey.png')} style={{resizeMode: 'contain', width: 40}}/>
      )

    }
  }
}, {
  initialRouteName: 'Tokens',
  // order: ['Home', 'Apps', 'Tokens', 'Activity'],
  order: ['Apps', 'Tokens', 'Activity'],
  tabBarPosition: 'bottom',
  animationEnabled: true,
  tabBarOptions: {
    showLabel: false,
    backgroundColor: 'white',
    indicatorStyle: {
      backgroundColor: 'transparent',
    },
    labelStyle: {},
    allowFontScaling: true,
    activeTintColor: '#000',
    inactiveTintColor: '#fff',
    style: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 40,
    },

    showIcon: true
  },
});

const MainApp = createStackNavigator({
  Apps: { screen: AppTabNavigator },
  // Apps: { screen: MiniDapps.BridgeWater },
  ...MiniDapps,
}, {
  headerMode: 'none',
});

export const AliceMain = createAppContainer(MainApp);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      wallet: '',
      network: '',
      rotation: '',
    };

    OneSignal.init(env.onesignal);

    OneSignal.addEventListener('received', this.onReceived);
    OneSignal.addEventListener('opened', this.onOpened);
    OneSignal.addEventListener('ids', this.onIds);
    OneSignal.configure();
  }

  componentWillUnmount() {
    OneSignal.removeEventListener('received', this.onReceived);
    OneSignal.removeEventListener('opened', this.onOpened);
    OneSignal.removeEventListener('ids', this.onIds);
  }

  onReceived(notification) {
    console.log("Notification received: ", notification);
  }

  onOpened(openResult) {
    console.log('Message: ', openResult.notification.payload.body);
    if (openResult.notification.payload.title === "FOAM") {
      navigate('FoamMap', {poi: challengedPOI});
    }

    if (openResult.notification.payload.title === "E2E") {
      navigate('E2E');
    }
    if (openResult.notification.payload.title === "BridgeWater") {
      navigate('BridgeWater');
    }

    console.log('Data: ', openResult.notification.payload.title);
    console.log('isActive: ', openResult.notification.isAppInFocus);
    console.log('openResult: ', openResult);
  }

  onIds(device) {
    console.log('Device info: ', device);
  }

  componentDidMount() {
    // navigate('FoamMap', {poi: challengedPOI});
    this.getAddress();
    this.getOrientation();
    const aliceEventEmitter = Wallet.aliceEvent()
    aliceEventEmitter.addListener(
      "aliceEvent",
      (event) => {
        console.log('EVENT TRIGGERED: ')
        if (event.address) {
          console.log('WALLET INFO: ', event, event.address);
          this.setState({ wallet: event.address});
        }
        if (event.network) {
          console.log('NETWORK CHANGED: ', event, event.network);
          this.setState({ network: event.network});
        }
        if (event.orientation) {
          console.log('ROTATION CHANGED: ', event, event.orientation);
          this.setState({ orientation: event.orientation});
        }
      }
    );
  }

  getAddress = async () => {
    try {
      const address = await Wallet.getAddress();
    } catch(e) {
      console.log(e);
    }

  };

  getOrientation = async () => {
    try {
      console.log('ORIENTATION: ', await Settings.getOrientation());
    } catch(e) {
      console.log(e);
    }

  };

  render() {
    return (
      <AliceMain
        ref={navigatorRef => {
          NavigatorService.setContainer(navigatorRef);
        }}
      />
    );
  }
}

export default CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    height: 400,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    height: 140,
    width: 140,
    borderRadius: 20,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  text: {
    fontFamily: 'Helvetica',
    fontSize: 20,
    color: 'white',

  }
});

