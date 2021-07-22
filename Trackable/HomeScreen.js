import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Alert,
  NativeModules,
  Modal,
  Text,
  PermissionsAndroid
} from 'react-native';

import {
    Colors,
} from 'react-native/Libraries/NewAppScreen';

import Geolocation from 'react-native-geolocation-service';
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import { Input, Button, CheckBox } from 'react-native-elements';
import Config from './Confg';

const { RNTracker } = NativeModules;

const geolocationCfg = {
    accuracy: {
        android: 'high',
        ios: 'best',
    },
    enableHighAccuracy: true,
    distanceFilter: 0,
    interval: 5000,
    fastestInterval: 2000,
    forceRequestLocation: true,
    showLocationDialog: false,
    useSignificantChanges: false,
    timeout: 30000
};

const hasLocationPermission = async () => {
    if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      
        if (hasPermission) {
            return true;
        }
      
        const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      
        if (status === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        }        
        return false;
    }

    const openSetting = () => {
        Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings');
        });
    };
    const status = await Geolocation.requestAuthorization('always');

    if (status === 'granted') {
        return true;
    }

    if (status === 'denied') {
        Alert.alert('Location permission denied');
    }

    if (status === 'disabled') {
        Alert.alert(
        `Turn on Location Services to allow "${appConfig.displayName}" to determine your location.`,
        '',
        [
            { text: 'Go to Settings', onPress: openSetting },
            { text: "Don't Use Location", onPress: () => {} },
        ],
        );
    }

    return false;  
}

function distance(lat1, lon1, lat2, lon2) {
    const R = 6378.137; // Radius of earth in KM
    const dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    const dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d * 1000;
}

class LoginModal extends React.Component {
    state = {
        id: "",
        host: "",
        port: 8082,
        useTLS: false
    };

    componentDidMount() {
        Config.getId()
        .then((id) => {
            this.setState({id: id});
        });
        Config.getHost()
        .then((host) => {
            this.setState({host: host});
        });
        Config.getPort()
        .then((port) => {
            this.setState({port: port});
        });
        Config.getUseTLS()
        .then((useTLS) => {
            this.setState({useTLS: useTLS});
        });
    }

    login() {
        Config.setValues(this.state.id, this.state.host, this.state.port, this.state.useTLS);
        RNTracker.createService(this.state.host+":"+this.state.port, this.state.useTLS);
        RNTracker.register(this.state.id, true)
        .then(()=> {
            console.log(this.state.id+" registered");
            this.props.login();
        }) 
        .catch((err) => {
            console.log(err.message);
            if (err.message === "User "+this.state.id+" is already registered" || 
                err.message === "UNKNOWN: User "+this.state.id+" is already registered") {
                this.props.login();
            } else {
                Alert.alert(err.message);
            }
        });
    }

    render() {
        const visible = this.props.visible;
        const id = this.state.id;
        const host = this.state.host;
        const port = ""+this.state.port;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.dialog1}>
                    <View style={styles.dialog2}>
                        <Text style={styles.dialogtext}>Login</Text>
                    </View>
                    <Input label="ID"
                            value={id}
                            autoCapitalize="none" 
                            onChangeText={(id) => this.setState({id})} 
                            style={styles.entryField}
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <Input label="Host" 
                            value={host}
                            autoCapitalize="none" 
                            onChangeText={(host) => this.setState({host})} 
                            style={styles.entryField}
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <Input keyboardType='numeric' 
                            label="Port"
                            value={port}
                            onChangeText={(port) => this.setState({port})} 
                            style={styles.entryField} 
                            inputStyle={styles.label}
                            labelStyle={styles.label}>
                    </Input>
                    <CheckBox
                        title='Use TLS'
                        checked={this.state.useTLS}
                        onPress={() => this.setState({useTLS: !this.state.useTLS})}
                    />
                    <View style={styles.dialog3}>
                        <Button
                            onPress={() => {this.login();}}
                            title="OK"
                            icon={{name: 'plus', size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                    </View>
                </View>
            </Modal>
        );
    }
}

class HomeScreen extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            position: null,
            region: {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
            },
            isReporting: false,
            modalVisible: true,
            markers: []
        };
        Config.getId()
        .then((id) => {
            this.setState({id:id});
        });
    }

    componentDidMount() {
        const { navigation } = this.props;
        hasLocationPermission().then((hasPermission) => {
        this.watchId = Geolocation.watchPosition(
            (position) => {              
                if (this.state.isReporting) {
                    const lat = this.state.position.coords.latitude;
                    const lon = this.state.position.coords.longitude;
                    if (distance(position.coords.latitude, position.coords.longitude, lat, lon) > 100) {
                        RNTracker.reportLocation(this.state.id, position.coords.latitude, position.coords.longitude, Date.now());

                        const marker = {
                            position: {latitude: position.coords.latitude, longitude: position.coords.longitude},
                            title: Date(),
                            description: ""
                        }
                        this.state.markers.push(marker);
                        this.setState({markers: this.state.markers});
                    }
                }
                this.setState({position: position});
            },
            (error) => {
            this.setState({position: null});
            console.log(error);
            },
            geolocationCfg
        );

        Geolocation.getCurrentPosition(
            (position) => {
                const region = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421    
                }
                this.setState({position: position, region: region});
            },
            (error) => {
                Alert.alert(`Code ${error.code}`, error.message);
                this.setState({position: null});
                console.log(error);
            },
            geolocationCfg
        );      
        });
    }

    componentWillUnmount() {
        Geolocation.clearWatch(this.watchId);
    }

    login(host, port) {
        this.setState({modalVisible: false});
    }

    onCancel() {
        this.setState({modalVisible: false});
    }

    onRegionChange = (region) => {
        this.setState({ region });
    }

    render() {
        const isDarkMode = false;
        const backgroundStyle = {
            backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        };

        return (
        <SafeAreaView style={backgroundStyle}>
            <View style={{ padding: 10 }}>
                <View style={styles.linkContainer}>
                    <Button
                    title="Start Reporting"
                    disabled={this.state.isReporting}
                    icon={{name: 'location-arrow', size: 15, type: 'font-awesome'}}
                    onPress={() => {
                        RNTracker.startSession(this.state.id).then(() => {
                            RNTracker.startReporting(this.state.id)
                            .then(() => {
                                console.log("startReporting");
                                this.setState({isReporting: true});
                                Geolocation.getCurrentPosition(
                                    (position) => {
                                        this.setState({position: position});
                                        RNTracker.reportLocation(this.state.id, position.coords.latitude, position.coords.longitude, Date.now());
                                    },
                                    (error) => {
                                        Alert.alert(`Code ${error.code}`, error.message);
                                        console.log(error);
                                    },
                                    geolocationCfg
                                );                  
                            })
                            .catch((err) => {
                                Alert.alert(`Start Reporting Error`, err.message);
                            });
                        })
                        .catch((err) => {
                            Alert.alert(`Start Reporting Error`, err.message);
                        });
                    }}
                    />
                    <Button
                    title="Stop Reporting"
                    disabled={!this.state.isReporting}
                    icon={{name: 'times-circle', size: 15, type: 'font-awesome'}}
                    onPress={() => {
                        this.setState({markers: []});
                        RNTracker.stopReporting(this.state.id);
                        RNTracker.stopSession(this.state.id).then(() => {
                            this.setState({isReporting: false});
                        });
                    }}
                    />
                </View>
                <View style={styles.container}>
                    <MapView
                        style={styles.map}
                        region={this.state.region}
                        showsUserLocation={true}
                        followsUserLocation={true}
                        onRegionChange={this.onRegionChange}>
                        {this.state.markers.map((marker, index) => (
                            <Marker
                                key={index}
                                coordinate={marker.position}
                                title={marker.title}
                                description={marker.description}
                                tracksViewChanges={false}
                            />                    
                        ))}    
                    </MapView>
                    <LoginModal visible={this.state.modalVisible} login={() => this.setState({modalVisible: false})}></LoginModal>
                </View>
            </View>    
        </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    linkContainer: {
        justifyContent: 'space-evenly',
        flexDirection: 'row', 
        alignItems: 'center',
        padding: 5,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
    container: {
        height: 550,
        width: 300,
        alignItems: 'center',
        width: '100%'
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    item: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        color: '#000'
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
        color: '#000'
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#3396FF',
        padding: 10,
        borderRadius: 5
    },
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    },
    dialog1: {marginTop: 22, flex: .8, flexDirection: 'column', justifyContent: 'space-around', backgroundColor: '#fff'},
    dialog2: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', backgroundColor: '#fff' },
    dialogtext: { fontSize: 20, fontFamily: 'GillSans-Italic', color: '#000'}
});

export default HomeScreen;