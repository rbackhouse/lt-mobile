import React from 'react';
import {
    StyleSheet,
    View,
    NativeEventEmitter, 
    NativeModules,
    Text,

  } from 'react-native';
  
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';

import { Marker } from 'react-native-maps';
import Config from './Confg';

const { RNTracker } = NativeModules;
const emitter = new NativeEventEmitter(RNTracker);

class TrackingMapScreen extends React.Component {
    state = {
        region: {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
        },
        markers: [],
        trackeeName: ""
    }

    constructor(props) {
        super(props);
        this.regionSet = false;
    }

    componentDidMount() {
        const { route } = this.props;
        this.setState({trackeeName: route.params.trackeeName});
        this.sub1 = emitter.addListener(
            "OnTrackingData",
            (trackingData) => {
                console.log(trackingData);
                if (this.regionSet === false) {
                    this.regionSet = true;
                    const region = {
                        latitude: trackingData.latitude,
                        longitude: trackingData.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421    
                    }
                    this.setState({region: region});
                    console.log("set region");
                }

                let timestamp = new Date(0);
                timestamp.setUTCSeconds(trackingData.timestamp);
        
                const marker = {
                    position: {latitude: trackingData.latitude, longitude: trackingData.longitude},
                    title: timestamp.toString(),
                    description: ""
                }
                this.state.markers.push(marker);
                this.setState({markers: this.state.markers});
            }
        );
        Config.getId()
        .then((id) => {
            RNTracker.startTracking(route.params.trackeeName, id);
        });
    }

    componentWillUnmount() {
        Config.getId()
        .then((id) => {
            RNTracker.stopTracking(this.state.trackeeName, id)
            .then(() => {
            })
            .catch((err) => {
                Alert.alert(err.message);
            });
            this.sub1.remove();
        });
    }

    onRegionChange = (region) => {
        this.setState({ region });
    }

    render() {
        return (
            <View>
            <View style={styles.linkContainer}>
                <Text style={styles.text}>Trackee: {this.state.trackeeName}</Text>
            </View>
            <View style={styles.container}>
                <MapView
                    style={styles.map}
                    region={this.state.region}
                    onRegionChange={this.onRegionChange}>
                {this.state.markers.map((marker, index) => (
                    <Marker
                        key={index}
                        coordinate={marker.position}
                        title={marker.title}
                        description={marker.description}
                    />                    
                ))}    
                </MapView>
            </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    linkContainer: {
        justifyContent: 'space-evenly',
        flexDirection: 'row', 
        alignItems: 'center',
        padding: 5,
    },
    text: {
        fontSize: 18,
        color: '#000'
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
});
    

export default TrackingMapScreen;