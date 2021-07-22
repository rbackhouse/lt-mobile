import React from 'react';
import { Text, View, NativeModules, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { SearchBar } from "react-native-elements";
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

const { RNTracker } = NativeModules;

class TrackingScreen extends React.Component {
    state = {
        trackables: [],
        searchValue: ""
    }

    componentDidMount() {
        RNTracker.getTrackables()
        .then((trackables) => {
            let t = [];
            trackables.forEach((trackable) =>{
                t.push({name: trackable})
            });
            this.setState({trackables: t});
        })
        .catch((err) => {
            Alert.alert(err.message);
        })
    }

    componentWillUnmount() {
    }

    onPress(item) {
        const { navigation } = this.props;
        navigation.navigate('Tracking Map', {trackeeName: item.name});
    }

    track(rowMap, item) {
        if (rowMap[item.name]) {
			rowMap[item.name].closeRow();
        }
        const { navigation } = this.props;
        navigation.navigate('Tracking Map', {trackeeName: item.name});
    }

    history(rowMap, item) {
        if (rowMap[item.name]) {
			rowMap[item.name].closeRow();
        }
        const { navigation } = this.props;
        navigation.navigate('History', {trackeeName: item.name});
    }

    search = (text) => {
    }

    renderItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={styles.item}>
                    <Text style={styles.title}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.container2}>
                    <View style={styles.flex75}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            platform="ios"
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={styles.searchbarContainer}
                            inputContainerStyle={styles.searchbarInputContainer}
                            inputStyle={styles.searchbarInput}
                        />
                    </View>
                    <View style={styles.flex25}>
                        <Text style={styles.text}>
                            Total : {this.state.trackables.length}
                        </Text>
                    </View>
                </View>
                <View style={{ flex:1, padding: 10 }}>
                <SwipeListView
                    useFlatList
                    data={this.state.trackables}
                    keyExtractor={item => item.name}
                    renderItem={(data, map) => {
                        const openVal = -150;
                        const item = data.item;
                        return (
                        <SwipeRow rightOpenValue={openVal}>
                            <View style={styles.rowBack}>
                            <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.history(map, item, false) }>
                                    <Text style={styles.backTextWhite}>History</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.track(map, item) }>
                                    <Text style={styles.backTextWhite}>Track</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.container3, styles.rowFront]}>
                                <View style={styles.container4}>
                                    <Text style={styles.item}>{item.name}</Text>
                                </View>
                            </View>
                        </SwipeRow>
                    );}}
                />
                </View>
            </SafeAreaView>            
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    item: {
        backgroundColor: '#CED0CE',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    title: {
        fontSize: 20,
    },
    flex75: {flex: .75},
    flex25: {flex: .25},
    searchbarContainer: {
        backgroundColor: '#fff'
    },
    searchbarInputContainer: {
        backgroundColor: '#CED0CE'
    },
    searchbarInput: { 
        backgroundColor: '#CED0CE',
        color: '#000'
    },
    text: {
        fontSize: 18,
        color: '#000'
    },
    container2: { flex: .12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingLeft: 15, paddingRight: 15 },
    rowFront: {
		alignItems: 'center',
		backgroundColor: '#fff',
		justifyContent: 'center',
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
    },
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
    },
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},    
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
	},
    backTextWhite: {
        color: '#000'
	},
    container3: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
    container4: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5, backgroundColor: '#fff' },
});
  

export default TrackingScreen;