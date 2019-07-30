import {Component} from "react";
import {
  Clipboard,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Text,
  Image,
  View,
  Dimensions,
  TouchableOpacity,
  Animated,
  RefreshControl
} from "react-native";
import React from "react";
import MapboxGL from "@react-native-mapbox-gl/maps";
import {onSortOptions} from "../../Apps/Foam/utils";
const { height, width } = Dimensions.get('window');
const cols = 2, rows = 2;
import NFT from '../../AliceComponents/NFT'
import Token from '../../AliceComponents/Token'
import {navigate} from "../../AliceUtils/navigationWrapper";
import Modal from "react-native-modal";
import QRCode from 'react-native-qrcode-svg';
import {ENS, Wallet} from '../../AliceSDK/Web3'
import AppIcon from "../../AliceComponents/AppIcon";
import {AppRegistry} from "../../Apps/AppRegistry";
import TransactionModal from '../../AliceComponents/TransactionModal'
import CameraModal from "../../AliceComponents/TransactionModal/CameraModal";
import Camera from "../../AliceComponents/Camera";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

//TODO: needs api key


export default class Tokens extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tokenInfo: '',
      token: '',
      tokens: [],
      ethereum: {},
      nfts: [],
      fetching: true,
      profileModalVisible: false,
      tokenModalVisible: false,
      transactionModalVisible: false,
      cameraModalVisible: false,
      cameraMode: false,
      address: '',
      addressStatus: 'unresolved',
      inputAddress: '',
      ethBalance: 0,
      animatePress: new Animated.Value(1),
      amount: 0,
      tokenAmount: 0,
      canSend: false
    };

  }

  async componentDidMount() {
    this.getTokenInfo();
    this.getNFTInfo();
    this.setState({address: await Wallet.getAddress()})
    this.getBalance()
  }

  getBalance = async () => {
    const ethBalance = await Wallet.getBalance();
    this.setState({ethBalance})
  }

  _refresh = () => {
    ReactNativeHapticFeedback.trigger("selection", options);
    this.getTokenInfo();
    this.getNFTInfo();
  }


  getTokenInfo = async () => {
    this.setState({fetching: true})
    let data = null;
    var xhr = new XMLHttpRequest();
    const onData = (data) => this.setState({tokenInfo: data, tokens: data.tokens});
    const finishedFetching = () => this.setState({fetching: false})
    xhr.addEventListener("readystatechange",  function()  {
      if (this.readyState === this.DONE) {
        onData(JSON.parse(this.responseText));
        finishedFetching();
      }
    });
    xhr.open("GET", "https://api.ethplorer.io/getAddressInfo/"+await Wallet.getAddress()+"?apiKey=freekey");
    xhr.send(data);

  };

  toggleModal = () => {
    this.setState({profileModalVisible: !this.state.profileModalVisible})
  };

  openTokenModal = (tokenInfo, token) => {
    // this.setState({transactionModalVisible: !this.state.transactionModalVisible, tokenInfo, token})

    this.setState({ tokenModalVisible: !this.state.tokenModalVisible, tokenInfo, token, tokenAmount: (parseInt(token.balance)/Math.pow(10, parseInt(tokenInfo.decimals))).toFixed(4)});
  };

  closeTokenModal = () => {
    this.setState({tokenModalVisible: !this.state.tokenModalVisible, amount: '', inputAddress: '', addressStatus: 'invalid'})
  };

  setTokenAmount = (amount) => {
    if (parseInt(amount) > this.state.tokenAmount) {
      this.setState({amountColor: '#cc2538', canSend: false})
    } else {
      this.setState({amountColor: '#000000', canSend: true})
    }
    this.setState({amount})
  };

  copyAddress = async () => {
    return await Clipboard.getString(this.state.address)
  };

  getNFTInfo = async () => {
    let data = null;
    var xhr = new XMLHttpRequest();
    const onData = (data) => {
      this.setState({nftInfo: data, nfts: data.assets});
    }
    xhr.addEventListener("readystatechange",  function()  {
      if (this.readyState === this.DONE) {
        onData(JSON.parse(this.responseText));
      }
    });
    xhr.open("GET", "https://api.opensea.io/api/v1/assets?owner="+await Wallet.getAddress());
    xhr.send(data);

  };

  resolveAddress = async (ensUsername) => {
    if (!ensUsername) {
      this.setState({addressStatus: 'unresolved', inputAddress: ensUsername});
      return;
    }
    this.setState({inputAddress: ensUsername});
    const address = await ENS.resolve(ensUsername);
    console.log('ADDRESS RETURNED FROM ENS: ', address);
    if (address === "0x0000000000000000000000000000000000000000") {
      this.setState({addressStatus: 'invalid', addressChecked: true});
    } else if (ENS.isPublicAddress(address)) {
      console.log('returning verifies', address);
      this.setState({addressStatus: 'valid', addressChecked: true});
    }
  };

  _addressScan =  async (address) => {
    console.log('ADDRESS: ', address);
    const resolve = await this.resolveAddress(address);
    if (resolve) this.setState({ inputAddress: address });
  }

  renderVerification = () => {
    if (this.state.addressStatus === 'valid') {
      return <Image style={{resizeMode: 'contain', width: 30, height: 30}} source={require('../../AliceAssets/green-verify.png')} />
    } else if (this.state.addressStatus === 'invalid') {
      return <Image style={{resizeMode: 'contain', width: 30, height: 30}} source={require('../../AliceAssets/grey-verify.png')} />
    } else if (this.state.addressStatus === 'unresolved'){
      return <Image style={{resizeMode: 'contain', width: 30, height: 30}} source={require('../../AliceAssets/grey-verify.png')} />
    }
  };

  render() {
    const { transactionModalVisible, cameraModalVisible, cameraMode } = this.state;
    console.log('TOKENS: ', this.state.tokens)
    console.log('NFTS: ', this.state.nfts)
    console.log('APP REGISTRY: ', AppRegistry)
    return (
      <View style={{flex: 1}}>
        {cameraMode === false ? <View style={styles.container}>
          <View style={{
            width: '100%', padding: 20, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <TouchableOpacity style={{width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center'}} onPress={this.toggleModal}>
              <Image source={require('../../AliceAssets/avatar-black.png')} style={{ resizeMode: 'contain', width: 17, height: 17 }}/>
            </TouchableOpacity>
            <TouchableOpacity style={{width: 34, height: 34, alignItems: 'center', justifyContent: 'center'}} onPress={() => navigate('Activity')}>
              <Image source={require('../../AliceAssets/hamburger.png')} style={{ resizeMode: 'contain', width: 20, height: 20 }}/>
            </TouchableOpacity>
          </View>
          <ScrollView style={{flex: 1, width: '100%', padding: 10, backgroundColor: 'transparent'}} refreshControl={
            <RefreshControl
              refreshing={this.state.fetching}
              onRefresh={this._refresh}
            />
          }>
            <Text style={{fontWeight: '600', fontSize: 18}}>Tokens</Text>
            <TouchableWithoutFeedback>
              <Animated.View  style={{...styles.tokenBox, transform: [
                  {
                    scale: this.state.animatePress
                  }
                ]}}>
                <View style={styles.tokenContainer}>
                  <Image source={require('../../AliceAssets/ethereum.png')} style={styles.tokenImage}/>
                </View>

                <View style={{alignItems: 'flex-start', justifyContent: 'space-around'}}>
                  <Text>Ethereum</Text>
                  <Text>{parseFloat(this.state.ethBalance).toFixed(4)} ETH</Text>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
            {this.state.tokens && this.state.tokens.map((token, i) => {
              const {tokenInfo} = token;
              if (tokenInfo.name === "") return;
              return (
                <Token onPress={() => this.openTokenModal(tokenInfo, token)} key={i} iterator={i} tokenInfo={tokenInfo} token={token}/>
              )
            })}
            <Text style={{fontWeight: '600', fontSize: 18, marginBottom: 10, marginTop: 10}}>Unique Tokens</Text>
            <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'space-around'}}>
              {this.state.nfts.length > 0 && this.state.nfts.map((nft, i) => {
                if (nft.collection) {
                  return (
                    <NFT iterator={i} key={i} nft={nft}/>
                  )
                }
              })}
            </View>
          </ScrollView>
          {/*      ---------       Transaction Modal         ---------------           */}
          <Modal
            isVisible={this.state.tokenModalVisible}
            onBackdropPress={this.closeTokenModal}
            style={styles.modal}
          >
            <View style={{width: '100%', backgroundColor: 'white', padding: 5, borderRadius: 25, alignItems: 'center', justifyContent: 'center'}}>
              <Token tokenInfo={this.state.tokenInfo} token={this.state.token} />
            </View>
            <View style={{height: 100, width: '100%'}}>
              <ScrollView horizontal>
                {AppRegistry.map((app, i) => {
                  return (<AppIcon key={i} appName={app.appName} backgroundColor={app.backgroundColor} homeRoute={app.homeRoute} icon={app.icon} iterator={i} />)
                })
                }
              </ScrollView>
            </View>
            <View style={{width: '100%', backgroundColor: 'white', padding: 5, borderRadius: 15, alignItems: 'center', justifyContent: 'center'}}>
              <View style={{width: '100%', height: 50, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.1)', padding: 5, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <TouchableOpacity onPress={() => this.setState({cameraMode: true})}>
                  <Image source={require('../../AliceAssets/cam-icon-black.png')} style={{width: 30, resizeMode: 'contain', marginRight: 5}}/>
                </TouchableOpacity>
                <TextInput autoCorrect={false} autoCapitalize={false} style={{flex: 1, paddingRight: 5}} placeholder="Enter address or ENS" onChangeText={this.resolveAddress} value={this.state.inputAddress}/>
                {this.renderVerification()}
              </View>
              <View style={{width: '100%', height: 50, backgroundColor: 'rgba(0,0,0,0.1)', padding: 5, paddingLeft: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <TextInput keyboardType={'numeric'} autoCorrect={false} autoCapitalize={false} style={{flex: 1, paddingRight: 5, color: this.state.amountColor}} placeholder="Enter amount to send" onChangeText={this.setTokenAmount} value={this.state.amount}/>
                <TouchableOpacity style={{backgroundColor: '#26a1ff', padding: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12}} onPress={() => this.setState({amount: this.state.tokenAmount})}>
                  <Text style={{color: 'white', fontSize: 14, fontWeight: '700'}}>Max</Text>
                </TouchableOpacity>
              </View>
              <View style={{width: '100%', height: 50, padding: 5, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <Text numberOfLines={1} style={{color: 'grey', fontSize: 14, fontWeight: '700'}}>Price: {this.state.tokenInfo.price ? (this.state.amount * this.state.tokenInfo.price.rate).toFixed(2) : 0.00} USD</Text>
              </View>
              <View style={{width: '100%', height: 50, padding: 5, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <TouchableOpacity style={{backgroundColor: '#333333', padding: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12}} onPress={() => this.state.canSend && this.state.addressStatus === 'valid' &&  Wallet.sendTransaction({to: this.state.inputAddress, value: this.state.amount })}>
                  <Text style={{color: 'white', fontSize: 14, fontWeight: '700'}}>SEND</Text>
                </TouchableOpacity>
              </View>
            </View>

          </Modal>
          {/*      ---------       Transaction Modal         ---------------           */}
          <Modal
            isVisible={this.state.profileModalVisible}
            onBackdropPress={this.toggleModal}
            style={styles.modal}
          >
            <View style={styles.modalBox}>
              <QRCode
                value={`${this.state.address}`}
              />
              <Text style={{color: 'black'}}>{this.state.address}</Text>
            </View>
            <View style={{flexDirection: 'row', marginTop: 10}}>
              <TouchableOpacity onPress={this.copyAddress} style={{ ...styles.buttons, marginRight: 7, borderTopRightRadius: 7, borderTopLeftRadius: 20, borderBottomRightRadius: 7, borderBottomLeftRadius: 20 }}>
                <Image style={{width: 20, resizeMode: 'contain'}} source={require('../../AliceAssets/copy.png')}/>
                <Text style={{fontSize: 17, fontWeight: '700', color: 'white'}}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ ...styles.buttons, borderTopRightRadius: 20, borderTopLeftRadius: 7, borderBottomRightRadius: 20, borderBottomLeftRadius: 7 }}>
                <Image style={{width: 20, resizeMode: 'contain'}} source={require('../../AliceAssets/share.png')}/>
                <Text style={{fontSize: 17, fontWeight: '700', color: 'white'}}>Share</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View> : <Camera close={() => this.setState({cameraMode: false})} onBarCodeRead={this._addressScan}/> }
      </View>)
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    backgroundColor: 'transparent'
  },
  buttons: {
    backgroundColor: 'rgba(256,256,256,0.5)',
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBox: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 25,
  },
  tokenBox: {
    flexDirection: 'row',
    width: '100%',
    margin: 8,

  },
  tokenContainer: {
    backgroundColor: '#ffffff',
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#212121',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 10,
    shadowOpacity: 0.1,

  },
  tokenImage: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
  },
});