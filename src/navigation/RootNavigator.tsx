import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import GeoFenceScreen from "../screens/GeoFenceScreen";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import ProfileScreen from "../screens/ProfileScreen";
import HistoryScreen from "../screens/HistoryScreen";


export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Map: undefined;
  GeoFence: undefined;
  Profile: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="GeoFence" component={GeoFenceScreen} />
            <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: "Profile & Contacts" }}
            />
            <Stack.Screen
             name="History"
             component={HistoryScreen}
             options={{ title: "My SOS History" }}
             />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
