// src/screens/MapScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { getCurrentLocation, Coordinates } from "../services/location";

type MapScreenProps = {
  navigation: any;
};

export default function MapScreen({}: MapScreenProps) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        setCoords(loc);
        setRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to get location");
      }
    };

    loadLocation();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  if (!region || !coords) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} onRegionChange={setRegion}>
        <Marker
          coordinate={{
            latitude: coords.latitude,
            longitude: coords.longitude,
          }}
          title="You"
          description="Your current location"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    paddingHorizontal: 16,
    textAlign: "center",
  },
});
