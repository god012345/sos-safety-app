import * as Location from "expo-location";
import { Alert, Platform } from "react-native";

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  timestamp?: number;
};

export async function requestLocationPermission(): Promise<boolean> {
  try {
    // For iOS 14+ and Android 12+
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== "granted") {
      Alert.alert(
        "Location Permission Required",
        "GuardianSOS needs location access to send your position during emergencies.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Location.getProviderStatusAsync() }
        ]
      );
      return false;
    }

    // Request background permission for geo-fencing
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.log("Background location permission not granted - geo-fencing limited");
      }
    }

    return true;
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<Coordinates> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error("Location permission denied");
    }

    // Get high accuracy location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000, // Accept location up to 10 seconds old
      timeout: 15000, // 15 second timeout
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      speed: location.coords.speed,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("Error getting location:", error);
    
    // Try lower accuracy as fallback
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000,
        timeout: 10000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: Date.now(),
      };
    } catch (fallbackError) {
      throw new Error(`Failed to get location: ${fallbackError.message}`);
    }
  }
}

export async function startBackgroundLocationTracking(
  callback: (location: Coordinates) => void
): Promise<() => void> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error("Location permission denied");
    }

    // Configure location tracking
    await Location.startLocationUpdatesAsync("background-location", {
      accuracy: Location.Accuracy.High,
      distanceInterval: 50, // Update every 50 meters
      timeInterval: 30000, // Update every 30 seconds
      foregroundService: {
        notificationTitle: "GuardianSOS Location Tracking",
        notificationBody: "Active for your safety",
        notificationColor: "#ef4444",
      },
    });

    // Listen for location updates
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 50,
        timeInterval: 30000,
      },
      (location) => {
        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: Date.now(),
        };
        callback(coords);
      }
    );

    return () => {
      subscription.remove();
      Location.stopLocationUpdatesAsync("background-location");
    };
  } catch (error) {
    console.error("Error starting background tracking:", error);
    throw error;
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}