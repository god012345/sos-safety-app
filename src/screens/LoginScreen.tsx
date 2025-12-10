import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

type LoginScreenProps = {
  navigation: any;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const handleLogin = () => {
    // Later: real login with Firebase
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS Safety App</Text>
      <Text style={styles.subtitle}>Login (Temporary Dummy Screen)</Text>
      <Button title="Continue to Home" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#555",
  },
});
