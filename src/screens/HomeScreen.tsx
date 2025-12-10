import React, { useRef, useState } from "react";
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
import { triggerSos } from "../services/sos";
import { getCurrentLocation } from "../services/location";

type HomeScreenProps = { navigation: any };

export default function HomeScreen({ navigation }: HomeScreenProps) {
  // 🔄 Activate multi-mode SOS sensors while on Home
  useShakeToSos(true);
  useFallDetectionSos(true);
  useInactivitySos(false); // set to true for inactivity demo if you want

  const [secretCount, setSecretCount] = useState(0);
  const secretTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = () => {
    signOut(auth);
  };

  // 🕵️ Secret gesture: tap app title 5 times within 3 seconds
  const handleSecretTap = async () => {
    if (secretTimerRef.current) {
      clearTimeout(secretTimerRef.current);
    }

    setSecretCount((prev) => {
      const next = prev + 1;

      if (next >= 5) {
        // secret pattern matched
        (async () => {
          try {
            const coords = await getCurrentLocation();
            await triggerSos("secret", coords);
            Alert.alert("Secret SOS", "Hidden SOS sent to your contacts.");
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to send secret SOS");
          }
        })();

        // reset
        secretTimerRef.current = null;
        return 0;
      }

      // reset counter if no further taps in 3 seconds
      secretTimerRef.current = setTimeout(() => {
        setSecretCount(0);
        secretTimerRef.current = null;
      }, 3000);

      return next;
    });
  };

  // 🎙️ Voice SOS (demo) – calls the same pipeline a voice command would
  const handleVoiceSosDemo = async () => {
    try {
      const coords = await getCurrentLocation();
      await triggerSos("voice", coords);
      Alert.alert("Voice SOS", 'Simulated "Help me" command SOS sent.');
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send voice SOS");
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
            Smart personal safety with live location, geo-fence alerts & offline
            SOS.
          </Text>
        </View>

        {/* SOS section */}
        <View style={styles.sosSection}>
          <Text style={styles.sectionTitle}>Emergency</Text>
          <Text style={styles.sectionSubtitle}>
            Press the button if you feel unsafe. We’ll attach your live
            location, risk level & notify your trusted contacts.
          </Text>

          <View style={{ marginTop: spacing.l }}>
            <SosButton />
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
                title="Geo-Fence Trip"
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
                title="SOS History"
                onPress={() => navigation.navigate("History")}
              />
              <Text style={styles.actionHint}>Timeline of past alerts</Text>
            </View>

            <View style={styles.actionItem}>
              <Button
                title="Profile & Contacts"
                onPress={() => navigation.navigate("Profile")}
              />
              <Text style={styles.actionHint}>
                Update emergency phone numbers
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Button
                title="Voice SOS (Demo)"
                onPress={handleVoiceSosDemo}
              />
              <Text style={styles.actionHint}>
                Simulated “Help me” voice SOS
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button title="Logout" onPress={handleLogout} />
          <Text style={styles.footerText}>
            Stay safe. Share this app with someone you care about.
          </Text>
        </View>
      </ScrollView>
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
});
