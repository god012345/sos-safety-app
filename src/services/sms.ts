// src/services/sms.ts
import * as SMS from "expo-sms";
import type { Coordinates } from "./location";

const EMERGENCY_NUMBERS = ["6383889363"]; 
// ⚠️ Replace with demo / test number(s) for hackathon demo.

export async function sendEmergencySms(coords?: Coordinates) {
  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("SMS is not available on this device");
  }

  let message =
    "SOS! I am in danger. Please check my location and help me as soon as possible.";

  if (coords) {
    const { latitude, longitude } = coords;
    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    message += `\n\nMy location: ${mapsLink}`;
  }

  const { result } = await SMS.sendSMSAsync(EMERGENCY_NUMBERS, message);

  return result; // "sent" | "cancelled"
}
