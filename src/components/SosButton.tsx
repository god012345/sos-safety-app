// src/components/SosButton.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Button,
} from "react-native";
import { getCurrentLocation } from "../services/location";
import { triggerSos } from "../services/sos";
import { sendEmergencySms } from "../services/sms";

export default function SosButton() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  const handleAppSos = async () => {
    try {
      setLoading(true);
      setStatus("Getting location...");
      const coords = await getCurrentLocation();

      setStatus("Sending SOS via internet...");
      await triggerSos("button", coords);

      setStatus("✅ SOS sent with location (online)!");
    } catch (error: any) {
      console.error(error);
      setStatus("❌ " + (error.message || "Failed to send SOS"));
    } finally {
      setLoading(false);
    }
  };

  const handleSmsSos = async () => {
    try {
      setSmsLoading(true);
      setStatus("Getting location for SMS...");
      const coords = await getCurrentLocation();

      setStatus("Opening SMS app with emergency message...");
      const result = await sendEmergencySms(coords);

      if (result === "sent") {
        setStatus("✅ SMS SOS sent!");
      } else {
        setStatus("⚠️ SMS cancelled by user.");
      }
    } catch (error: any) {
      console.error(error);
      setStatus("❌ " + (error.message || "Failed to send SMS SOS"));
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        activeOpacity={0.8}
        onPress={handleAppSos}
        disabled={loading || smsLoading}
      >
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text style={styles.buttonText}>SOS</Text>
        )}
      </TouchableOpacity>

      <View style={styles.smsButtonWrapper}>
        <Button
          title={
            smsLoading
              ? "Preparing SMS..."
              : "Send SOS via SMS (Offline Fallback)"
          }
          onPress={handleSmsSos}
          disabled={loading || smsLoading}
        />
      </View>

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
  smsButtonWrapper: {
    marginTop: 20,
    width: 260,
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
});
