const BACKEND_URL = "http://192.168.137.1:8000"; // ← your IP

export async function notifyBackendSOS(payload: {
  userId: string;
  latitude?: number;
  longitude?: number;
  riskLevel: string;
  message: string;
  phoneNumbers: string[];
  demoMode: boolean;
  
}) {
  try {
    await fetch(`${BACKEND_URL}/send-sos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("Backend not reachable");
  }
}
