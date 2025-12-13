import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Button, Alert, ScrollView } from "react-native";
import * as Location from "expo-location";
import { getCurrentLocation, Coordinates } from "../services/location";
import { triggerSos } from "../services/sos";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { colors, spacing } from "../config/theme";

type GeoFenceScreenProps = {
  navigation: any;
};

// Haversine distance formula
function distanceInMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371e3; // earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
}

export default function GeoFenceScreen({}: GeoFenceScreenProps) {
  const [safeZoneCenter, setSafeZoneCenter] = useState<Coordinates | null>(null);
  const [radius, setRadius] = useState<number>(50); // 50 meters
  const [current, setCurrent] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);

  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const safeCenterRef = useRef<Coordinates | null>(null);
  const alertSentRef = useRef<boolean>(false);

  const startSafeTrip = async () => {
    try {
      const loc = await getCurrentLocation();

      // update state (for UI)
      setSafeZoneCenter(loc);
      setCurrent(loc);
      setDistance(0);
      setAlertSent(false);
      
      // Set map region
      setMapRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      });

      // update refs (for watcher callback)
      safeCenterRef.current = loc;
      alertSentRef.current = false;

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // every 3s
          distanceInterval: 5, // every 5 meters
        },
        async (pos) => {
          const now: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };

          setCurrent(now);

          const safeCenter = safeCenterRef.current;
          if (!safeCenter) return;

          const d = distanceInMeters(safeCenter, now);
          setDistance(d);

          if (d > radius && !alertSentRef.current) {
            alertSentRef.current = true;
            setAlertSent(true);

            Alert.alert(
              "⚠️ Geo-Fence Alert",
              `You left your safe area (${d.toFixed(1)} m away). Sending SOS...`,
              [
                {
                  text: "Cancel SOS",
                  style: "cancel",
                  onPress: () => {
                    alertSentRef.current = false;
                    setAlertSent(false);
                  }
                },
                {
                  text: "OK",
                  onPress: async () => {
                    try {
                      await triggerSos("geofence", now);
                      Alert.alert("✅ SOS Sent", "Geo-fence SOS sent successfully.");
                    } catch (e: any) {
                      Alert.alert("Error", e?.message || "Failed to send geo-fence SOS");
                    }
                  }
                }
              ]
            );
          }
        },
      );

      watchSub.current = sub;
      setMonitoring(true);
      Alert.alert("✅ Safe Zone Set", `Monitoring active within ${radius}m radius.`);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not start trip");
    }
  };

  const stopMonitoring = () => {
    if (watchSub.current) {
      watchSub.current.remove();
      watchSub.current = null;
    }
    setMonitoring(false);
    Alert.alert("Monitoring Stopped", "Geo-fence monitoring has been stopped.");
  };

  const increaseRadius = () => setRadius(prev => Math.min(prev + 10, 200));
  const decreaseRadius = () => setRadius(prev => Math.max(prev - 10, 20));

  useEffect(() => {
    return () => {
      if (watchSub.current) {
        watchSub.current.remove();
      }
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Geo-Fence Safe Trip</Text>
      <Text style={styles.subtitle}>
        Set your current position as a safe zone. If you leave the area, an SOS will be triggered automatically.
      </Text>

      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Set Safe Zone & Start"
            onPress={startSafeTrip}
            disabled={monitoring}
            color={colors.accent}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Stop Monitoring"
            onPress={stopMonitoring}
            disabled={!monitoring}
            color={colors.textSecondary}
          />
        </View>
      </View>

      {/* Radius controls */}
      <View style={styles.radiusControls}>
        <Text style={styles.radiusLabel}>Safe Zone Radius: {radius}m</Text>
        <View style={styles.radiusButtons}>
          <Button title="-" onPress={decreaseRadius} color={colors.accent} />
          <Text style={styles.radiusValue}>{radius}m</Text>
          <Button title="+" onPress={increaseRadius} color={colors.accent} />
        </View>
      </View>

      {/* Map view */}
      {safeZoneCenter && mapRegion && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
          >
            <Circle
              center={{
                latitude: safeZoneCenter.latitude,
                longitude: safeZoneCenter.longitude,
              }}
              radius={radius}
              strokeColor={colors.accent + "80"}
              fillColor={colors.accent + "20"}
              strokeWidth={2}
            />
            <Marker
              coordinate={{
                latitude: safeZoneCenter.latitude,
                longitude: safeZoneCenter.longitude,
              }}
              title="Safe Zone Center"
              pinColor={colors.success}
            />
            {current && (
              <Marker
                coordinate={{
                  latitude: current.latitude,
                  longitude: current.longitude,
                }}
                title="Your Position"
                pinColor={colors.accent}
              />
            )}
          </MapView>
        </View>
      )}

      {/* Info panels */}
      {safeZoneCenter && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📍 Safe Zone</Text>
          <Text style={styles.infoText}>
            Lat: {safeZoneCenter.latitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            Lon: {safeZoneCenter.longitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>Radius: {radius} meters</Text>
          <Text style={styles.infoText}>
            Status: {monitoring ? "🟢 ACTIVE" : "🔴 INACTIVE"}
          </Text>
        </View>
      )}

      {current && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📍 Current Position</Text>
          <Text style={styles.infoText}>
            Lat: {current.latitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            Lon: {current.longitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            Distance: {distance !== null ? distance.toFixed(1) : "-"} m
          </Text>
          <Text style={styles.infoText}>
            Alert: {alertSent ? "🟡 TRIGGERED" : "🟢 READY"}
          </Text>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How it works:</Text>
        <Text style={styles.instructionsText}>1. Tap "Set Safe Zone & Start"</Text>
        <Text style={styles.instructionsText}>2. Move outside the red circle</Text>
        <Text style={styles.instructionsText}>3. SOS will trigger automatically</Text>
        <Text style={styles.instructionsText}>4. Tap "Stop Monitoring" when done</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.l,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.l,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.l,
    gap: spacing.m,
  },
  buttonWrapper: {
    flex: 1,
  },
  radiusControls: {
    backgroundColor: colors.card,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.s,
  },
  radiusButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radiusValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: colors.card,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  instructions: {
    backgroundColor: colors.card + "80",
    padding: spacing.m,
    borderRadius: 12,
    marginTop: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  instructionsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 2,
  },
});