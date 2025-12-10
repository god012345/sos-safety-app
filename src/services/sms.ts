// src/services/sms.ts
import * as SMS from "expo-sms";
import type { Coordinates } from "./location";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

type ProfileData = {
  fullName?: string;
  primaryNumber?: string;
  secondaryNumber?: string;
};

async function getEmergencyNumbersForCurrentUser(): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not logged in. Please login again.");
  }

  const ref = doc(db, "profiles", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error(
      "No profile found. Please add your emergency contacts in the Profile screen."
    );
  }

  const data = snap.data() as ProfileData;
  const nums: string[] = [];

  if (data.primaryNumber && data.primaryNumber.trim() !== "") {
    nums.push(data.primaryNumber.trim());
  }
  if (data.secondaryNumber && data.secondaryNumber.trim() !== "") {
    nums.push(data.secondaryNumber.trim());
  }

  if (nums.length === 0) {
    throw new Error(
      "No emergency numbers found. Please add at least one number in the Profile screen."
    );
  }

  return nums;
}

export async function sendEmergencySms(coords?: Coordinates) {
  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("SMS is not available on this device");
  }

  const numbers = await getEmergencyNumbersForCurrentUser();

  let message =
    "SOS! I am in danger. Please check my location and help me as soon as possible.";

  if (coords) {
    const { latitude, longitude } = coords;
    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    message += `\n\nMy location: ${mapsLink}`;
  }

  const { result } = await SMS.sendSMSAsync(numbers, message);

  return result; // "sent" | "cancelled"
}
