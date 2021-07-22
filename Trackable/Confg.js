import { Settings } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

export default {
    setValues: function(id, host, port, useTLS) {
        if (Platform.OS === 'android') {
            AsyncStorage.setItem('@Trackable:id', id);
            AsyncStorage.setItem('@Trackable:host', host);
            AsyncStorage.setItem('@Trackable:port', port);
            AsyncStorage.setItem('@Trackable:useTLS', String(useTLS));
        } else {
            Settings.set({id: id, host: host, port: port, useTLS: useTLS});
        }
    },
    getId: function() {
        if (Platform.OS === 'android') {
            return AsyncStorage.getItem('@Trackable:id');
        } else {
            return Promise.resolve(Settings.get("id"));
        }
    },
    getHost: function() {
        if (Platform.OS === 'android') {
            return AsyncStorage.getItem('@Trackable:host');
        } else {
            return Promise.resolve(Settings.get("host"));
        }
    },
    getPort: function() {
        if (Platform.OS === 'android') {
            return AsyncStorage.getItem('@Trackable:port');
        } else {
            return Promise.resolve(Settings.get("port"));
        }
    },
    getUseTLS: function() {
        if (Platform.OS === 'android') {
            const promise = new Promise((resolve, reject) => {
                AsyncStorage.getItem('@Trackable:useTLS')
                .then((useTLS) => {
                    resolve(useTLS == 'true');
                });
            });
            return promise;
        } else {
            return Promise.resolve(Settings.get("useTLS"));
        }
    }
}