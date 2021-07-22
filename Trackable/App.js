import React from 'react';

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './HomeScreen';
import TrackingScreen from './TrackingScreen';
import TrackingMapScreen from './TrackingMapScreen';
import HistoryScreen from './HistoryScreen';

const Tab = createBottomTabNavigator();

const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Trackable" component={HomeScreen} />             
    </HomeStack.Navigator>
  );
}

const TrackingStack = createStackNavigator();

function TrackingStackScreen() {
  return (
    <TrackingStack.Navigator>
      <TrackingStack.Screen name="Tracking" component={TrackingScreen} />             
      <TrackingStack.Screen name="Tracking Map" component={TrackingMapScreen} />             
      <TrackingStack.Screen name="History" component={HistoryScreen} />             
    </TrackingStack.Navigator>
  );
}  


export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused
                ? 'ios-information-circle'
                : 'ios-information-circle-outline';
            } else if (route.name === 'Tracking') {
              iconName = focused ? 'ios-list-circle' : 'ios-list-circle-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'tomato',
          inactiveTintColor: 'gray',
        }}      
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Tracking" component={TrackingStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}