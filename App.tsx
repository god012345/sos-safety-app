import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { SosModeProvider } from "./src/context/SosModeContext";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AuthProvider>
        <SosModeProvider>
        <RootNavigator />
        </SosModeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
