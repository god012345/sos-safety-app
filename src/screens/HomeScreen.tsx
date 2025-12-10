// src/screens/HomeScreen.tsx
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import SosButton from "../components/SosButton";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { colors, spacing } from "../config/theme";
import {
  useShakeToSos,
  useFallDetectionSos,
  useInactivitySos,
} from "../hooks/useSensorSos";
import { getCurrentLocation } from "../services/location";
import type { Coordinates } from "../services/location";
import { triggerSos } from "../services/sos";
import { sendEmergencySms } from "../services/sms";

type HomeScreenProps = { navigation: any };

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [secretCount, setSecretCount] = useState(0);
  const secretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-SMS countdown state
  const [pendingCoords, setPendingCoords] = useState<Coordinates | undefined>(
    undefined
  );
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleLogout = () => {
    signOut(auth);
  };

  // Start the 60s timer whenever any (non-secret) SOS is created
  const startAutoSmsFlow = useCallback((coords?: Coordinates) => {
    setPendingCoords(coords);
    setCountdown(60); // 60 seconds
  }, []);

  // Cancel flow if user taps "Cancel SOS"
  const cancelAutoSmsFlow = useCallback(() => {
    setCountdown(null);
    setPendingCoords(undefined);
  }, []);

  // Decrease countdown every second
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) return;

    const id = setTimeout(() => {
      setCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(id);
  }, [countdown]);

  // When countdown reaches 0, send SMS automatically
  useEffect(() => {
    if (countdown !== 0 || !pendingCoords) return;

    (async () => {
      try {
        await sendEmergencySms(pendingCoords);
        // We keep an alert only for important info (auto SMS triggered or failed)
        Alert.alert(
          "SOS SMS",
          "No response from user. SOS message has been prepared for your contacts."
        );
      } catch (e: any) {
        console.error(e);
        Alert.alert(
          "Error",
          e?.message || "Failed to send emergency SMS automatically"
        );
      } finally {
        setCountdown(null);
        setPendingCoords(undefined);
      }
    })();
  }, [countdown, pendingCoords]);

  // Handle shake SOS: create SOS + start auto-SMS (no popup)
  const handleShakeSos = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      await triggerSos("shake", coords);
      startAutoSmsFlow(coords);
    } catch (e: any) {
      console.log("Shake SOS error", e);
    }
  }, [startAutoSmsFlow]);
  // Handle fall SOS: create SOS + start auto-SMS (no popup)
  const handleFallSos = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      await triggerSos("fall", coords);
      startAutoSmsFlow(coords);
    } catch (e: any) {
      console.log("Fall SOS error", e);
    }
  }, [startAutoSmsFlow]);

  // Handle inactivity SOS: create SOS + start auto-SMS (no popup)
  const handleInactivitySos = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      await triggerSos("inactivity", coords);
      startAutoSmsFlow(coords);
    } catch (e: any) {
      console.log("Inactivity SOS error", e);
    }
  }, [startAutoSmsFlow]);
  
  // Activate multi-mode SOS sensors while on Home
  useShakeToSos(true, handleShakeSos);
  useFallDetectionSos(true, handleFallSos);
  useInactivitySos(false, handleInactivitySos); // set true if you want inactivity-based auto-SOS

  // Secret tap: 5x on title -> silent SOS (no timer, no SMS, no alerts)
  const handleSecretTap = () => {
    if (secretTimerRef.current) {
      clearTimeout(secretTimerRef.current);
    }

    setSecretCount((prev) => {
      const next = prev + 1;

      if (next >= 5) {
        (async () => {
          try {
            const coords = await getCurrentLocation();
            await triggerSos("secret", coords);
            // ❗ no startAutoSmsFlow here – secret = purely silent SOS
          } catch (e: any) {
            console.log("Secret SOS error", e);
          }
        })();

        secretTimerRef.current = null;
        return 0;
      }

      secretTimerRef.current = setTimeout(() => {
        setSecretCount(0);
        secretTimerRef.current = null;
      }, 3000);

      return next;
    });
  };

  // Voice SOS (demo): create SOS + start auto-SMS (no popup)
  const handleVoiceSosDemo = async () => {
    try {
      const coords = await getCurrentLocation();
      await triggerSos("voice", coords);
      startAutoSmsFlow(coords);
    } catch (e: any) {
      console.log("Voice SOS error", e);
    }
  };

  


  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.8}>
            <Text style={styles.appTitle}>GuardianSOS</Text>
          </TouchableOpacity>
          <Text style={styles.tagline}>
            Smart personal safety with multi-mode SOS, live location, geo-fence
            alerts & offline SMS fallback.
          </Text>
        </View>

        {/* SOS section */}
        <View style={styles.sosSection}>
          <Text style={styles.sectionTitle}>Emergency</Text>
          <Text style={styles.sectionSubtitle}>
            Press the SOS button if you feel unsafe. We attach your live
            location, compute a risk score, and alert your trusted contacts.
          </Text>

          <View style={{ marginTop: spacing.l }}>
            <SosButton onAfterSos={startAutoSmsFlow} />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Button
                title="View My Location"
                onPress={() => navigation.navigate("Map")}
              />
              <Text style={styles.actionHint}>Map with live position</Text>
            </View>

            <View style={styles.actionItem}>
              <Button
                title="Geo-Fence Safe Trip"
                onPress={() => navigation.navigate("GeoFence")}
              />
              <Text style={styles.actionHint}>
                Auto-SOS when leaving safe zone
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Button
                title="Profile & Contacts"
                onPress={() => navigation.navigate("Profile")}
              />
              <Text style={styles.actionHint}>
                Set your name & emergency numbers
              </Text>
            </View>

            <View style={styles.actionItem}>
              <Button
                title="My SOS History"
                onPress={() => navigation.navigate("History")}
              />
              <Text style={styles.actionHint}>Timeline of past alerts</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Button title="Voice SOS (Demo)" onPress={handleVoiceSosDemo} />
              <Text style={styles.actionHint}>
                Simulated voice-triggered SOS pipeline
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button title="Logout" onPress={handleLogout} />
          <Text style={styles.footerText}>
            Tip: You can also shake your phone to trigger SOS with auto
            countdown, or tap the GuardianSOS title 5 times for a silent SOS.
          </Text>
        </View>
      </ScrollView>

      {/* Countdown overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownCard}>
            <Text style={styles.countdownTitle}>SOS Pending Confirmation</Text>
            <Text style={styles.countdownText}>
              If you do nothing, we will prepare and send an SOS message to your
              emergency contacts in:
            </Text>
            <Text style={styles.countdownNumber}>{countdown}s</Text>
            <Text style={styles.countdownSub}>
              Tap "Cancel SOS" if this was a mistake.
            </Text>
            <View style={{ marginTop: 16 }}>
              <Button title="Cancel SOS" onPress={cancelAutoSmsFlow} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.l,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.l,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sosSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.m,
    gap: spacing.m,
  },
  actionItem: {
    flex: 1,
  },
  actionHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    marginTop: spacing.m,
    alignItems: "center",
  },
  footerText: {
    marginTop: spacing.s,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  countdownOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.l,
  },
  countdownCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
    textAlign: "center",
  },
  countdownText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ef4444",
    textAlign: "center",
    marginTop: spacing.m,
  },
  countdownSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.s,
  },
});
