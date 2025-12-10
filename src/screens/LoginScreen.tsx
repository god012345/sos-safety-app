import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebase";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      // Navigation handled automatically by AuthContext + RootNavigator
    } catch (e: any) {
      Alert.alert("Error", e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>SOS Safety App</Text>

      <Text style={styles.subtitle}>
        {mode === "login" ? "Login" : "Create Account"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
        onPress={handleSubmit}
        disabled={loading}
      />

      <Text style={styles.switchText} onPress={toggleMode}>
        {mode === "login"
          ? "Don't have an account? Sign Up"
          : "Already have an account? Login"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  appTitle: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 18, textAlign: "center", marginVertical: 20 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  switchText: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
  },
});
