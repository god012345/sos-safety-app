import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import GeoFenceScreen from "../screens/GeoFenceScreen"; // ⬅️ add this

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Map: undefined;
  GeoFence: undefined; // ⬅️ add this
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "SOS Home" }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ title: "Your Location" }}
        />
        <Stack.Screen
          name="GeoFence"
          component={GeoFenceScreen}
          options={{ title: "Geo-Fence Safe Trip" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
