// src/components/SosButton.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getCurrentLocation } from "../services/location";
import { triggerSos } from "../services/sos";

export default function SosButton() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    try {
      setLoading(true);
      setStatus("Getting location...");
      const coords = await getCurrentLocation();

      setStatus("Sending SOS...");
      await triggerSos("button", coords);

      setStatus("✅ SOS sent with location!");
    } catch (error: any) {
      console.error(error);
      setStatus("❌ " + (error.message || "Failed to send SOS"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text style={styles.buttonText}>SOS</Text>
        )}
      </TouchableOpacity>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
});
