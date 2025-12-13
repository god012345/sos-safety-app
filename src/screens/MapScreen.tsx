import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { getCurrentLocation, Coordinates } from "../services/location";
import { colors } from "../config/theme";

type MapScreenProps = {
  navigation: any;
};

export default function MapScreen({}: MapScreenProps) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    loadLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.errorSubtext}>
          Please enable location permissions in settings
        </Text>
      </View>
    );
  }

  if (!region || !coords) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Preparing map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        region={region} 
        onRegionChangeComplete={setRegion}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        toolbarEnabled={true}
      >
        <Marker
          coordinate={{
            latitude: coords.latitude,
            longitude: coords.longitude,
          }}
          title="You are here"
          description="Your current location"
          pinColor={colors.accent}
        />
      </MapView>
      <View style={styles.coordsPanel}>
        <Text style={styles.coordsText}>
          📍 Lat: {coords.latitude.toFixed(6)}
        </Text>
        <Text style={styles.coordsText}>
          📍 Lon: {coords.longitude.toFixed(6)}
        </Text>
        {coords.accuracy && (
          <Text style={styles.coordsText}>
            Accuracy: ±{coords.accuracy.toFixed(1)}m
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.accent,
    fontSize: 16,
    paddingHorizontal: 16,
    textAlign: "center",
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  coordsPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.card + 'CC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coordsText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginVertical: 2,
  },
});