import { db, auth } from "./firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import type { Coordinates } from "./location";
import { Alert } from "react-native";
import { notifyBackendSOS } from "./backend";

/* =========================
   TYPES
========================= */

export type SosMethod =
  | "button"
  | "shake"
  | "voice"
  | "geofence"
  | "secret"
  | "fall"
  | "inactivity"
  | "power";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface SosData {
  id: string;
  userId: string;
  method: SosMethod;
  location: Coordinates | null;
  riskScore: number;
  riskLevel: RiskLevel;
  aiSummary: string;
  status: "ACTIVE" | "PENDING" | "RESOLVED" | "CANCELLED";
  createdAt: any;
  updatedAt: any;
  respondedBy?: string;
  responseNotes?: string;
}

/* =========================
   RISK SCORING
========================= */

function computeRiskScore(
  method: SosMethod,
  coords?: Coordinates
): {
  score: number;
  level: RiskLevel;
  summary: string;
} {
  let score = 0;
  const reasons: string[] = [];
  const time = new Date();
  const hour = time.getHours();

  const methodScores: Record<SosMethod, number> = {
    button: 40,
    shake: 65,
    voice: 75,
    geofence: 60,
    secret: 70,
    fall: 85,
    inactivity: 55,
    power: 90,
  };

  score += methodScores[method] || 50;
  reasons.push(`Triggered via ${method}`);

  if (hour >= 22 || hour < 5) {
    score += 20;
    reasons.push("Night time (higher risk)");
  } else if (hour >= 18 && hour < 22) {
    score += 10;
    reasons.push("Evening hours");
  }

  const day = time.getDay();
  if (day === 0 || day === 6) {
    score += 5;
    reasons.push("Weekend");
  }

  if (coords?.accuracy) {
    if (coords.accuracy > 100) {
      score -= 10;
      reasons.push("Low location accuracy");
    } else if (coords.accuracy <= 20) {
      score += 5;
      reasons.push("High precision location");
    }
  }

  const simulatedBattery = Math.random() * 100;
  if (simulatedBattery < 20) {
    score += 15;
    reasons.push("Low battery – may lose contact");
  }

  score = Math.max(0, Math.min(100, score));

  let level: RiskLevel = "LOW";
  if (score >= 80) level = "CRITICAL";
  else if (score >= 65) level = "HIGH";
  else if (score >= 45) level = "MEDIUM";

  const summary = `
🚨 SOS Alert – ${level} Risk (${score}/100)

Detection Method: ${method.toUpperCase()}
Time: ${time.toLocaleString()}
${coords
  ? `Location: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
  : "Location: Unknown"}

Risk Factors:
${reasons.map((r) => `• ${r}`).join("\n")}

Recommended Action:
${
  level === "CRITICAL" || level === "HIGH"
    ? "Immediate response required. Contact emergency services."
    : "Check on user status. Follow up if no response."
}
`.trim();

  return { score, level, summary };
}

/* =========================
   TRIGGER SOS
========================= */

export async function triggerSos(
  method: SosMethod,
  coords?: Coordinates,
  demoMode: boolean = false
): Promise<SosData> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated. Please login.");
    }

    const { score, level, summary } = computeRiskScore(method, coords);

    // 1️⃣ Save SOS to Firestore
    const sosRef = await addDoc(collection(db, "sosRequests"), {
      userId: user.uid,
      method,
      location: coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp: coords.timestamp,
          }
        : null,
      riskScore: score,
      riskLevel: level,
      aiSummary: summary,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      respondedBy: null,
      responseNotes: null,
    });

    // 2️⃣ Notify Backend (Twilio SMS + Email)
    notifyBackendSOS({
      userId: user.uid,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      riskLevel: level,
      message: summary,
      phoneNumbers: ["+126383889363"], // replace later with profile data
      demoMode: demoMode,  
    });

    // 3️⃣ Return data to UI
    return {
      id: sosRef.id,
      userId: user.uid,
      method,
      location: coords || null,
      riskScore: score,
      riskLevel: level,
      aiSummary: summary,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error("Error triggering SOS:", error);
    throw new Error(`Failed to create SOS: ${error.message}`);
  }
}

/* =========================
   UPDATE SOS STATUS
========================= */

export async function updateSosStatus(
  sosId: string,
  status: SosData["status"],
  notes?: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const sosRef = doc(db, "sosRequests", sosId);

    await updateDoc(sosRef, {
      status,
      responseNotes: notes,
      respondedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Error updating SOS status:", error);
    throw new Error(`Failed to update SOS: ${error.message}`);
  }
}

/* =========================
   SUBSCRIBE TO USER SOS
========================= */

export function subscribeToUserSos(
  userId: string,
  callback: (sosList: SosData[]) => void
): () => void {
  try {
    const q = query(
      collection(db, "sosRequests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sosList: SosData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          sosList.push({
            id: docSnap.id,
            userId: data.userId,
            method: data.method,
            location: data.location,
            riskScore: data.riskScore,
            riskLevel: data.riskLevel,
            aiSummary: data.aiSummary,
            status: data.status,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            respondedBy: data.respondedBy,
            responseNotes: data.responseNotes,
          });
        });
        callback(sosList);
      },
      (error) => {
        console.error("Error subscribing to SOS:", error);
        Alert.alert("Connection Error", "Unable to sync SOS data");
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up SOS subscription:", error);
    return () => {};
  }
}

/* =========================
   CANCEL SOS
========================= */

export async function cancelSos(sosId: string): Promise<void> {
  try {
    await updateSosStatus(sosId, "CANCELLED", "Cancelled by user");
  } catch (error) {
    console.error("Error cancelling SOS:", error);
    throw error;
  }
}
