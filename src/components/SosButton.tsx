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
import type { Coordinates } from "../services/location";
import { colors, spacing } from "../config/theme";

type SosButtonProps = {
  onAfterSos?: (coords?: Coordinates, aiSummary?: string) => void;
};

export default function SosButton({ onAfterSos }: SosButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handlePress = async () => {
    try {
      setLoading(true);
      setStatus("Getting your location...");
      const coords = await getCurrentLocation();
      
      setStatus("Creating SOS alert...");
      const sos = await triggerSos("button", coords);
      
      setStatus("SOS created! Preparing alerts...");
      
      // FIX: Pass both parameters to callback
      if (onAfterSos) {
        onAfterSos(coords, sos.aiSummary);
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
      <TouchableOpacity
        style={[styles.sosButton, loading && styles.sosButtonDisabled]}
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.sosButtonText}>
          {loading ? "🚨 SENDING..." : "🚨 SEND SOS"}
        </Text>
        {loading && <ActivityIndicator color="white" style={styles.spinner} />}
      </TouchableOpacity>
      
      {status && <Text style={styles.status}>{status}</Text>}
      
      <Text style={styles.hint}>
        Tap to send emergency alert to your contacts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  sosButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    elevation: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    flexDirection: 'row',
    gap: spacing.s,
  },
  sosButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  sosButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  spinner: {
    marginLeft: spacing.s,
  },
  status: {
    marginTop: spacing.m,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  hint: {
    marginTop: spacing.s,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
});