// src/screens/GeoFenceScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import * as Location from "expo-location";
import { getCurrentLocation, Coordinates } from "../services/location";
import { triggerSos } from "../services/sos";

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
  const [radius] = useState<number>(30); // 🔥 SMALLER for testing (30m)
  const [current, setCurrent] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

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

          // 🔥 For debug, log to console
          console.log("Distance from safe zone:", d, "meters");

          if (d > radius && !alertSentRef.current) {
            alertSentRef.current = true;
            setAlertSent(true);

            Alert.alert(
              "Geo-Fence Alert",
              `You left your safe area (${d.toFixed(
                1,
              )} m away). Sending SOS...`,
            );

            try {
              await triggerSos("geofence", now);
              Alert.alert("SOS Sent", "Geo-fence SOS sent successfully.");
            } catch (e: any) {
              Alert.alert(
                "Error",
                e?.message || "Failed to send geo-fence SOS",
              );
            }
          }
        },
      );

      watchSub.current = sub;
      setMonitoring(true);
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
  };

  useEffect(() => {
    return () => {
      if (watchSub.current) {
        watchSub.current.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geo-Fence Safe Trip</Text>
      <Text style={styles.subtitle}>
        Set your current position as a safe zone. If you leave the area, an SOS
        will be triggered automatically.
      </Text>

      <View style={{ marginVertical: 20 }}>
        <Button
          title="Set Safe Zone & Start Trip"
          onPress={startSafeTrip}
          disabled={monitoring}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Button
          title="Stop Monitoring"
          onPress={stopMonitoring}
          disabled={!monitoring}
        />
      </View>

      {safeZoneCenter && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Safe Zone</Text>
          <Text>
            Lat: {safeZoneCenter.latitude.toFixed(5)} | Lon:{" "}
            {safeZoneCenter.longitude.toFixed(5)}
          </Text>
          <Text>Radius: {radius} meters</Text>
        </View>
      )}

      {current && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Current Position</Text>
          <Text>
            Lat: {current.latitude.toFixed(5)} | Lon:{" "}
            {current.longitude.toFixed(5)}
          </Text>
          <Text>
            Distance from safe zone:{" "}
            {distance !== null ? distance.toFixed(1) : "-"} m
          </Text>
          <Text>Monitoring: {monitoring ? "Yes" : "No"}</Text>
          <Text>Alert sent: {alertSent ? "Yes" : "No"}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#555",
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
});
