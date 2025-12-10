// src/services/sos.ts
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Coordinates } from "./location";
import { auth } from "./firebase";

export type SosMethod =   | "button"
  | "shake"
  | "voice"
  | "geofence"
  | "secret"
  | "fall"
  | "inactivity"
  | "power";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

function computeRiskScore(method: SosMethod, coords?: Coordinates): {
  score: number;
  level: RiskLevel;
  summary: string;
} {
  let score = 0;
  let reasons: string[] = [];

  // Base score by method
    switch (method) {
    case "button":
      score += 40;
      reasons.push("Manual SOS button pressed");
      break;
    case "shake":
      score += 55;
      reasons.push("Detected strong shake pattern (possible struggle)");
      break;
    case "voice":
      score += 70;
      reasons.push("Voice-triggered SOS (hands may be blocked)");
      break;
    case "geofence":
      score += 55;
      reasons.push("User left safe geo-fence area unexpectedly");
      break;
    case "secret":
      score += 60;
      reasons.push("Secret gesture used (discreet SOS)");
      break;
    case "fall":
      score += 75;
      reasons.push("Possible fall detected from motion pattern");
      break;
    case "inactivity":
      score += 50;
      reasons.push("No movement detected for extended period");
      break;
    case "power":
      score += 80;
      reasons.push("Hardware power button pattern triggered SOS");
      break;
  }


  // Time-based adjustment
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) {
    score += 15;
    reasons.push("Triggered during night hours");
  } else if (hour >= 18 && hour < 22) {
    score += 5;
    reasons.push("Triggered during evening hours");
  }

  // Location accuracy adjustment
  if (coords?.accuracy && coords.accuracy > 50) {
    score -= 5;
    reasons.push("Lower GPS accuracy");
  } else if (coords?.accuracy && coords.accuracy <= 20) {
    score += 5;
    reasons.push("High GPS accuracy for responders");
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let level: RiskLevel = "LOW";
  if (score >= 70) level = "HIGH";
  else if (score >= 45) level = "MEDIUM";

  const summary =
    `Risk Level: ${level} (Score: ${score}/100). ` +
    reasons.join(". ") +
    ".";

  return { score, level, summary };
}

export async function triggerSos(method: SosMethod, coords?: Coordinates) {
  const { score, level, summary } = computeRiskScore(method, coords);

  const user = auth.currentUser;
  const userId = user ? user.uid : "anonymous";

  await addDoc(collection(db, "sosRequests"), {
    userId,
    createdAt: serverTimestamp(),
    status: "ACTIVE",
    method,
    location: coords
      ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? null,
        }
      : null,
    riskScore: score,
    riskLevel: level,
    aiSummary: summary,
  });
}
