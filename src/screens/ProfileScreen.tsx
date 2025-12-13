import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { colors, spacing } from "../config/theme";

type ProfileData = {
  fullName: string;
  primaryNumber: string;
  secondaryNumber: string;
};

export default function ProfileScreen() {
  const [fullName, setFullName] = useState("");
  const [primaryNumber, setPrimaryNumber] = useState("");
  const [secondaryNumber, setSecondaryNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const ref = doc(db, "profiles", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as ProfileData;
          setFullName(data.fullName || "");
          setPrimaryNumber(data.primaryNumber || "");
          setSecondaryNumber(data.secondaryNumber || "");
        }
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Missing Info", "Full name is required.");
      return;
    }

    if (!primaryNumber.trim()) {
      Alert.alert("Missing Info", "Primary emergency number is required.");
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(primaryNumber.replace(/\s/g, ''))) {
      Alert.alert("Invalid Number", "Please enter a valid primary phone number.");
      return;
    }

    if (secondaryNumber.trim() && !phoneRegex.test(secondaryNumber.replace(/\s/g, ''))) {
      Alert.alert("Invalid Number", "Please enter a valid secondary phone number or leave it empty.");
      return;
    }

    try {
      setLoading(true);
      const ref = doc(db, "profiles", user.uid);
      const payload: ProfileData = {
        fullName: fullName.trim(),
        primaryNumber: primaryNumber.trim(),
        secondaryNumber: secondaryNumber.trim(),
      };
      await setDoc(ref, payload, { merge: true });
      Alert.alert("✅ Saved", "Profile and emergency contacts updated successfully!");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Emergency Contacts</Text>
          <Text style={styles.subtitle}>
            These contacts will receive SOS alerts with your location when you trigger an emergency.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Emergency Number *</Text>
            <Text style={styles.labelHint}>This contact will receive all SOS alerts</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={primaryNumber}
              onChangeText={setPrimaryNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Secondary Emergency Number</Text>
            <Text style={styles.labelHint}>Optional backup contact</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={secondaryNumber}
              onChangeText={setSecondaryNumber}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📱 SMS Alert Information</Text>
            <Text style={styles.infoText}>
              • SMS will include your location as Google Maps link
            </Text>
            <Text style={styles.infoText}>
              • Messages are sent when you trigger SOS or auto-timer expires
            </Text>
            <Text style={styles.infoText}>
              • Works even without internet (offline SMS fallback)
            </Text>
            <Text style={styles.infoText}>
              • Make sure contacts have SMS enabled
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "💾 Save Profile & Contacts"}
            </Text>
          </TouchableOpacity>

          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Current Status:</Text>
            <Text style={styles.statusText}>
              • Name: {fullName || "Not set"}
            </Text>
            <Text style={styles.statusText}>
              • Primary: {primaryNumber || "Not set"}
            </Text>
            <Text style={styles.statusText}>
              • Secondary: {secondaryNumber || "Not set"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.l,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.s,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    gap: spacing.l,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  labelHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: colors.card,
    color: colors.textPrimary,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: colors.card + "80",
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.m,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.s,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBox: {
    backgroundColor: colors.card,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.l,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: 2,
  },
});