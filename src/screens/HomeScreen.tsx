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
  AppState,
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
import { sendEmergencySms, getEmergencyProfileForCurrentUser } from "../services/sms";
import { createVerifiedHelper } from "../services/verifiedHelper";
type HomeScreenProps = { navigation: any };

type PendingSms = {
  coords?: Coordinates;
  riskSummary?: string;
} | null;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [secretCount, setSecretCount] = useState(0);
  const secretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [hasEmergencyContacts, setHasEmergencyContacts] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);

  // Auto-SMS countdown state
  const [pendingSms, setPendingSms] = useState<PendingSms>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Check emergency contacts on mount
  useEffect(() => {
    const checkContacts = async () => {
      try {
        const profile = await getEmergencyProfileForCurrentUser();
        setHasEmergencyContacts(profile.numbers.length > 0);
        setContactsCount(profile.numbers.length);
      } catch (error) {
        setHasEmergencyContacts(false);
        setContactsCount(0);
      }
    };
    
    checkContacts();
  }, []);

  // App state listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        console.log("App in background - sensors running with reduced frequency");
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    Alert.alert(
      demoMode ? "Live Mode Activated" : "Demo Mode Activated",
      demoMode 
        ? "Real SMS will be sent to emergency contacts."
        : "SMS will be simulated. No real messages sent."
    );
  };

  // Countdown-enabled SMS flow (used by sensors: shake, fall, inactivity, voice)
  const startAutoSmsFlow = useCallback(
    (coords?: Coordinates, riskSummary?: string) => {
      if (!hasEmergencyContacts) {
        Alert.alert(
          "No Emergency Contacts",
          "Please add emergency contacts in Profile screen first.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Add Contacts", onPress: () => navigation.navigate("Profile") }
          ]
        );
        return;
      }

      if (demoMode) {
        Alert.alert(
          "Demo Mode",
          "In demo mode, SMS is simulated. No real messages sent.",
          [{ text: "OK" }]
        );
        setCountdown(null);
        setPendingSms(null);
        return;
      }

      setPendingSms({ coords, riskSummary });
      setCountdown(15); // 15-second countdown
    },
    [hasEmergencyContacts, demoMode, navigation]
  );

  const AutoSms = useCallback(
  async (coords?: Coordinates, riskSummary?: string) => {
    if (!hasEmergencyContacts) {
      Alert.alert(
        "No Emergency Contacts",
        "Please add emergency contacts in Profile screen first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Contacts", onPress: () => navigation.navigate("Profile") }
        ]
      );
      return;
    }

    // Disable countdown completely
    setCountdown(null);
    setPendingSms(null);

    if (demoMode) {
      Alert.alert(
        "Demo Mode",
        "In demo mode, SMS is simulated. No real messages sent."
      );
      return;
    }

    try {
      // 🚨 Send SMS immediately
      await sendEmergencySms(coords, riskSummary);

      Alert.alert(
        "SMS Sent",
        "Emergency message has been sent to your contacts."
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to send SMS");
    }
  },
  [hasEmergencyContacts, demoMode, navigation]
);


  // Cancel auto SMS
  const cancelAutoSmsFlow = useCallback(() => {
    setCountdown(null);
    setPendingSms(null);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) return;

    const id = setTimeout(() => {
      setCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(id);
  }, [countdown]);

  // When countdown ends → send SMS
  useEffect(() => {
    if (countdown !== 0 || !pendingSms || !pendingSms.coords) return;

    (async () => {
      try {
        if (demoMode) {
          Alert.alert(
            "Demo Complete",
            "In demo mode: SMS would have been sent to your contacts."
          );
        } else {
          await sendEmergencySms(pendingSms.coords, pendingSms.riskSummary);
          Alert.alert(
            "SOS SMS Sent",
            "Emergency message has been sent to your contacts."
          );
        }
      } catch (e: any) {
        console.error(e);
        Alert.alert(
          "Error",
          e?.message || "Failed to send emergency SMS automatically"
        );
      } finally {
        setCountdown(null);
        setPendingSms(null);
      }
    })();
  }, [countdown, pendingSms, demoMode]);

  // Shake SOS → countdown ON
  const handleShakeSos = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      const sos = await triggerSos("shake", coords);
      startAutoSmsFlow(coords, sos.aiSummary);
    } catch (e: any) {
      console.log("Shake SOS error", e);
    }
  }, [startAutoSmsFlow]);

  // Fall SOS → countdown ON
  const handleFallSos = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      const sos = await triggerSos("fall", coords);
      startAutoSmsFlow(coords, sos.aiSummary);
    } catch (e: any) {
      console.log("Fall SOS error", e);
    }
  }, [startAutoSmsFlow]);

  // Inactivity SOS → countdown ON
  const handleInactivitySos = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      const sos = await triggerSos("inactivity", coords);
      startAutoSmsFlow(coords, sos.aiSummary);
    } catch (e: any) {
      console.log("Inactivity SOS error", e);
    }
  }, [startAutoSmsFlow]);

  // Activate sensors
  useShakeToSos(true, handleShakeSos);
  useFallDetectionSos(true, handleFallSos);
  useInactivitySos(false, handleInactivitySos);

  // Secret Tap SOS → NO countdown
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
            Alert.alert("Silent SOS", "Silent SOS created successfully.");
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

  // Voice SOS → countdown ON
  const handleVoiceSosDemo = async () => {
    try {
      const coords = await getCurrentLocation();
      const sos = await triggerSos("voice", coords);
      startAutoSmsFlow(coords, sos.aiSummary);
    } catch (e: any) {
      console.log("Voice SOS error", e);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.8}>
              <Text style={styles.appTitle}>GuardianSOS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.demoBadge, 
                { backgroundColor: demoMode ? colors.success : colors.danger }
              ]}
              onPress={toggleDemoMode}
            >
              <Text style={styles.demoText}>
                {demoMode ? "🟢 DEMO" : "🔴 LIVE"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.tagline}>
            Smart personal safety with multi-mode SOS, live location, geo-fence alerts & offline SMS fallback.
          </Text>

          {!hasEmergencyContacts && (
            <TouchableOpacity 
              style={styles.contactWarning}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.contactWarningText}>
                ⚠️ Add emergency contacts to enable SMS alerts
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SOS SECTION */}
        <View style={styles.sosSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency</Text>
            {hasEmergencyContacts && (
              <Text style={styles.contactsInfo}>
                📞 {contactsCount} contact{contactsCount !== 1 ? "s" : ""} ready
              </Text>
            )}
          </View>

          <Text style={styles.sectionSubtitle}>
            Press the SOS button if you feel unsafe. We attach your live location, compute a risk score, and alert your trusted contacts.
          </Text>

          <View style={{ marginTop: spacing.l }}>
            {/* SOS BUTTON → NO COUNTDOWN */}
            <SosButton onAfterSos={AutoSms} />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Button
                title="View My Location"
                onPress={() => navigation.navigate("Map")}
                color={colors.accent}
              />
              <Text style={styles.actionHint}>Map with live position</Text>
            </View>

            <View style={styles.actionItem}>
              <Button
                title="Geo-Fence Safe Trip"
                onPress={() => navigation.navigate("GeoFence")}
                color={colors.accent}
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
                color={colors.accent}
              />
              <Text style={styles.actionHint}>
                Set your name & emergency numbers
              </Text>
            </View>

            <View style={styles.actionItem}>
              <Button
                title="My SOS History"
                onPress={() => navigation.navigate("History")}
                color={colors.accent}
              />
              <Text style={styles.actionHint}>Timeline of past alerts</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={[styles.actionItem, { width: "100%" }]}>
              <Button 
                title="Voice SOS (Demo)" 
                onPress={handleVoiceSosDemo} 
                color={colors.accent}
              />
              <Text style={styles.actionHint}>
                Simulated voice-triggered SOS pipeline
              </Text>
            </View>
          </View>
        </View>

        {/* SENSOR STATUS */}
        <View style={styles.sensorCard}>
          <Text style={styles.sectionTitle}>Active Sensors</Text>
          <View style={styles.sensorList}>
            <Text style={styles.sensorItem}>✅ Shake Detection</Text>
            <Text style={styles.sensorItem}>✅ Fall Detection</Text>
            <Text style={styles.sensorItem}>⏸️ Inactivity (disabled)</Text>
            <Text style={styles.sensorItem}>✅ Secret Tap (5x on title)</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          {/* <Button
  title="Create Demo Helper"
  onPress={() =>
    createVerifiedHelper("Helper One", {
      lat: 12.97,
      lng: 77.59,
    })
  }
/> */}
          <Button title="Logout" onPress={handleLogout} color={colors.textSecondary} />
          <Text style={styles.footerText}>
            Tip: You can also shake your phone to trigger SOS with auto countdown, or tap the GuardianSOS title 5 times for a silent SOS.
          </Text>
        </View>
      </ScrollView>

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownCard}>
            <Text style={styles.countdownTitle}>SOS Pending Confirmation</Text>
            <Text style={styles.countdownText}>
              If you do nothing, we will {demoMode ? "simulate sending" : "send"} an SOS message to your emergency contacts in:
            </Text>
            <Text style={styles.countdownNumber}>{countdown}s</Text>
            <Text style={styles.countdownSub}>
              Tap "Cancel SOS" if this was a mistake.
            </Text>
            <View style={{ marginTop: 16 }}>
              <Button title="Cancel SOS" onPress={cancelAutoSmsFlow} color={colors.textSecondary} />
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
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.l,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  demoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  demoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactWarning: {
    marginTop: spacing.m,
    backgroundColor: colors.warning + "20",
    padding: spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  contactWarningText: {
    color: colors.warning,
    fontSize: 13,
    textAlign: "center",
  },
  sosSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  contactsInfo: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "500",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
  sensorCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sensorList: {
    marginTop: spacing.s,
  },
  sensorItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: 4,
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
    lineHeight: 16,
  },
  countdownOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
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
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.accent,
    textAlign: "center",
    marginVertical: spacing.m,
  },
  countdownSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.s,
  },
});
