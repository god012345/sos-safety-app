import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

type HelperLocation = {
  lat: number;
  lng: number;
};

export async function createVerifiedHelper(
  name: string,
  location: HelperLocation
) {
  try {
    await addDoc(collection(db, "verifiedHelpers"), {
      name: name,
      isActive: true,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      createdAt: Date.now(),
    });

    console.log("✅ Verified helper created");
  } catch (error) {
    console.error("❌ Failed to create helper:", error);
  }
}
