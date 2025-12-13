import * as SMS from "expo-sms";
import type { Coordinates } from "./location";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

type ProfileData = {
  fullName?: string;
  primaryNumber?: string;
  secondaryNumber?: string;
};

type EmergencyProfile = {
  fullName: string;
  numbers: string[];
};

export async function getEmergencyProfileForCurrentUser(): Promise<EmergencyProfile> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not logged in. Please login again.");
  }

    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error(
      "No profile found. Please add your name and emergency contacts in the Profile screen."
    );
  }

  const data = snap.data() as ProfileData;
  const numbers: string[] = [];

  if (data.primaryNumber && data.primaryNumber.trim() !== "") {
    numbers.push(data.primaryNumber.trim());
  }
  if (data.secondaryNumber && data.secondaryNumber.trim() !== "") {
    numbers.push(data.secondaryNumber.trim());
    }

  if (numbers.length === 0) {
      throw new Error(
      "No emergency numbers found. Please add at least one number in the Profile screen."
      );
    }

  const fullName = data.fullName?.trim() || "Your contact";

  return { fullName, numbers };
}

export async function sendEmergencySms(
  coords?: Coordinates,
  riskSummary?: string
) {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("SMS is not available on this device");
    }

  const { fullName, numbers } = await getEmergencyProfileForCurrentUser();

  let message = `⚠️ SOS ALERT

${fullName} has triggered an SOS and may be in danger. Please check on them immediately.`;

    if (coords) {
      const { latitude, longitude } = coords;
    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      message += `

Location:
${mapsLink}`;
      }

    if (riskSummary) {
      message += `

Status:
${riskSummary}`;
    }

    message += `

Sent via GuardianSOS app.`;

  const { result } = await SMS.sendSMSAsync(numbers, message);

  return result; // "sent" | "cancelled"
}