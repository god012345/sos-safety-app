import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { colors, spacing } from "../config/theme";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Validation
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Missing Information", "Please enter email and password");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long"
      );
      return;
    }

    if (mode === "signup") {
      if (!trimmedConfirmPassword) {
        Alert.alert("Missing Information", "Please confirm your password");
        return;
      }

      if (trimmedPassword !== trimmedConfirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match");
        return;
      }
    }

    try {
      setLoading(true);
      
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        Alert.alert("Welcome Back", "Login successful!");
      } else {
        await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        Alert.alert(
          "🎉 Welcome to GuardianSOS!",
          "Account created successfully!\n\nNext steps:\n1. Add your emergency contacts\n2. Enable location permissions\n3. Test the SOS button",
          [{ text: "Get Started" }]
        );
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      
      let errorMessage = "Authentication failed. Please try again.";
      
      // Firebase error codes
      switch (e.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address format.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered. Please login instead.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Use at least 6 characters.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Check your internet connection.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          break;
      }
      
      Alert.alert("Authentication Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🛡️</Text>
              <Text style={styles.appTitle}>GuardianSOS</Text>
            </View>
            <Text style={styles.tagline}>
              Your personal safety companion with multi-mode SOS alerts
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </Text>
              <Text style={styles.formSubtitle}>
                {mode === "login" 
                  ? "Sign in to access your safety features" 
                  : "Join GuardianSOS for personal protection"}
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <Text style={styles.requirement}>
                  {mode === "signup" ? "Min. 6 characters" : ""}
                </Text>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (Signup only) */}
            {mode === "signup" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.eyeIcon}>
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {password && confirmPassword && password !== confirmPassword && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode Toggle */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {mode === "login" 
                  ? "Don't have an account?" 
                  : "Already have an account?"}
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.toggleLink}>
                  {mode === "login" ? " Sign Up" : " Sign In"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Demo Credentials */}
            {mode === "login" && (
              <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>For Demo:</Text>
                <Text style={styles.demoText}>Email: demo@guardiansos.com</Text>
                <Text style={styles.demoText}>Password: demo123</Text>
              </View>
            )}
          </View>

          {/* Features List */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Why GuardianSOS?</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚨</Text>
                <Text style={styles.featureText}>One-tap SOS with auto-location</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Shake detection for emergencies</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📍</Text>
                <Text style={styles.featureText}>Geo-fencing with auto alerts</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📞</Text>
                <Text style={styles.featureText}>Offline SMS to emergency contacts</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your safety is our priority. Data is encrypted and secure.
            </Text>
            <Text style={styles.versionText}>v1.0.0 • Hackathon Ready</Text>
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
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.l,
  },
  header: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.s,
  },
  logoIcon: {
    fontSize: 32,
    marginRight: spacing.s,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formHeader: {
    marginBottom: spacing.l,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: spacing.m,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  requirement: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#111827",
    color: colors.textPrimary,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.m,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.m,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "bold",
  },
  demoContainer: {
    marginTop: spacing.l,
    padding: spacing.m,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  demoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  featuresList: {
    gap: spacing.m,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
  },
  featureIcon: {
    fontSize: 20,
    width: 30,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.m,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  versionText: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});