// src/components/SosButton.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
} from "react-native";
import { getCurrentLocation } from "../services/location";
import { triggerSos } from "../services/sos";
import type { Coordinates } from "../services/location";

type SosButtonProps = {
  onAfterSos?: (coords?: Coordinates) => void;
};

export default function SosButton({ onAfterSos }: SosButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handlePress = async () => {
    try {
      setLoading(true);
      setStatus("Preparing SOS...");
      const coords = await getCurrentLocation();
      await triggerSos("button", coords);
      setStatus("SOS created. Preparing alerts...");
      if (onAfterSos) {
        onAfterSos(coords);
      }
    } catch (e: any) {
      console.error(e);
      setStatus(e?.message || "Failed to trigger SOS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={loading ? "Sending..." : "SEND SOS"}
        onPress={handlePress}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  status: {
    marginTop: 8,
    fontSize: 12,
    color: "#f9fafb",
  },
});
