import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import SosButton from "../components/SosButton";

type HomeScreenProps = { navigation: any };

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home – SOS Dashboard</Text>
      <Text style={styles.subtitle}>
        Press the SOS button to send an emergency alert with your location.
      </Text>

      <View style={{ marginTop: 40 }}>
        <SosButton />
      </View>

      <View style={{ marginTop: 30, width: "70%" }}>
        <Button
          title="View My Location on Map"
          onPress={() => navigation.navigate("Map")}
        />
      </View>

      <View style={{ marginTop: 16, width: "70%" }}>
        <Button
          title="Start Geo-Fence Safe Trip"
          onPress={() => navigation.navigate("GeoFence")}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button
          title="(Debug) Go back to Login"
          onPress={() => navigation.replace("Login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    paddingHorizontal: 16,
  },
});
