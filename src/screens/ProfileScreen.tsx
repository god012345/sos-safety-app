import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ScrollView,
} from "react-native";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

  const user = auth.currentUser;

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
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
        Alert.alert("Error", e?.message || "Failed to load profile");
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    if (!fullName || !primaryNumber) {
      Alert.alert("Missing info", "Full name and primary number are required.");
      return;
    }

    try {
      setLoading(true);
      const ref = doc(db, "profiles", user.uid);
      const payload: ProfileData = {
        fullName,
        primaryNumber,
        secondaryNumber,
      };
      await setDoc(ref, payload, { merge: true });
      Alert.alert("Saved", "Profile and emergency contacts updated!");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile & Emergency Contacts</Text>
      <Text style={styles.subtitle}>
        These contacts will be used when you trigger SOS via SMS.
      </Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Primary Emergency Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Mom / Dad number"
        keyboardType="phone-pad"
        value={primaryNumber}
        onChangeText={setPrimaryNumber}
      />

      <Text style={styles.label}>Secondary Emergency Number (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Friend / Partner number"
        keyboardType="phone-pad"
        value={secondaryNumber}
        onChangeText={setSecondaryNumber}
      />

      <View style={styles.buttonWrapper}>
        <Button
          title={loading ? "Saving..." : "Save Profile"}
          onPress={handleSave}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonWrapper: {
    marginTop: 24,
  },
});
