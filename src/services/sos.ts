// src/services/sos.ts
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Coordinates } from "./location";

export type SosMethod = "button" | "shake" | "voice" | "geofence";

export async function triggerSos(method: SosMethod, coords?: Coordinates) {
  await addDoc(collection(db, "sosRequests"), {
    userId: "demo-user", // later: real logged-in user id
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
  });
}
