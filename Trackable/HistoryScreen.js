import React from 'react';
import {
    StyleSheet,
    View,
    NativeEventEmitter, 
    NativeModules,
    Text,
    FlatList,
    TouchableOpacity
  } from 'react-native';
  
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';

const { RNTracker } = NativeModules;
const emitter = new NativeEventEmitter(RNTracker);

class HistoryScreen extends React.Component {
    state = {
        ids: [],
        sessionData: [],
        trackeeName: ""
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { route } = this.props;
        RNTracker.getSessionIds(route.params.trackeeName)
        .then((ids) => {
            console.log(ids);
            ids.forEach((id) => {
                console.log("id = "+id.sessionId);
                this.state.ids.push(id);
            });
            this.setState({ids: this.state.ids});
        })
        .catch((err) => {
            Alert.alert(err.message);
        });
    }

    componentWillUnmount() {
    }

    onPress(item) {
        RNTracker.getSessionData(item.sessionId)
        .then((sessionData) => {
            sessionData.forEach((sd, index) => {
                sd.title = "Marker "+index;
                sd.description = "Marker "+index;
            })
            this.setState({sessionData: sessionData});
        })
        .catch((err) => {
            Alert.alert(err.message);
        });
    }

    renderItem = ({item}) => {
        let timestamp = new Date(0);
        timestamp.setUTCSeconds(item.timestamp);
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={styles.item}>
                    <Text style={styles.text}>ID: {item.sessionId} {timestamp.toString()}</Text>
                </View>
            </TouchableOpacity>
        );
    };


    render() {
        return (
            <View style={styles.container}>
                <View style={styles.listContainer}>
                    <FlatList
                        data={this.state.ids}
                        renderItem={this.renderItem}
                        keyExtractor={(item) => item.sessionId}
                    />
                </View>
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        region={{
                            latitude: 35.7351642,
                            longitude: -78.8809882,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }
                    }>
                        {
                            this.state.sessionData.map((marker, index) => { console.log(marker); return (
                                        <Marker
                                            key={index}
                                            coordinate={
                                                {
                                                    latitude: marker.latitude,
                                                    longitude: marker.longitude,
                                                }                                
                                            }
                                            title={marker.title}
                                            description={marker.description}
                                        />
                                    )
                                }
                            )
                        }
                                    
                    </MapView>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        flex: .5
    },
    text: {
        fontSize: 15,
        color: '#000'
    },
    item: {
        backgroundColor: '#CED0CE',
        padding: 5,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    mapContainer: {
        flex: .5,
        height: 400,
        width: 300,
        alignItems: 'center',
        width: '100%',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },  
});

export default HistoryScreen;