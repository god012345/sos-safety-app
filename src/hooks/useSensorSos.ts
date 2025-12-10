// src/hooks/useSensorSos.ts
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { triggerSos } from "../services/sos";
import { getCurrentLocation } from "../services/location";

function magnitude(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

// small helper to avoid spamming SOS too often
function canTrigger(lastRef: React.MutableRefObject<number>, cooldownMs: number) {
  const now = Date.now();
  if (now - lastRef.current < cooldownMs) return false;
  lastRef.current = now;
  return true;
}

/**
 * Shake-to-SOS:
 * If device is shaken strongly, trigger SOS.
 */
export function useShakeToSos(enabled: boolean = true) {
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let sub: any;

    const subscribe = async () => {
      await Accelerometer.setUpdateInterval(200); // update every 200ms
      sub = Accelerometer.addListener(async (data) => {
        const g = magnitude(data.x, data.y, data.z); // ~1 g when still
        if (g > 1.8) {
          // threshold for strong shake
          if (!canTrigger(lastTriggerRef, 5000)) return; // 5s cooldown
          try {
            const coords = await getCurrentLocation();
            await triggerSos("shake", coords);
          } catch (e) {
            console.log("Shake SOS failed", e);
          }
        }
      });
    };

    subscribe();

    return () => {
      if (sub) sub.remove();
    };
  }, [enabled]);
}

/**
 * Fall detection SOS:
 * Very simple heuristic: near free-fall, then big impact.
 */
export function useFallDetectionSos(enabled: boolean = true) {
  const lastTriggerRef = useRef(0);
  const previousMagRef = useRef(1);

  useEffect(() => {
    if (!enabled) return;

    let sub: any;

    const subscribe = async () => {
      await Accelerometer.setUpdateInterval(100);
      sub = Accelerometer.addListener(async (data) => {
        const g = magnitude(data.x, data.y, data.z);

        const prev = previousMagRef.current;
        previousMagRef.current = g;

        const freeFall = prev < 0.3; // almost weightless
        const hardImpact = g > 2.8; // strong hit

        if (freeFall && hardImpact) {
          if (!canTrigger(lastTriggerRef, 10000)) return; // 10s cooldown
          try {
            const coords = await getCurrentLocation();
            await triggerSos("fall", coords);
          } catch (e) {
            console.log("Fall SOS failed", e);
          }
        }
      });
    };

    subscribe();

    return () => {
      if (sub) sub.remove();
    };
  }, [enabled]);
}

/**
 * No-movement for long time -> SOS.
 * For demo we use 30 seconds. In production: several minutes.
 */
export function useInactivitySos(enabled: boolean = false) {
  const lastMovementRef = useRef(Date.now());
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let sub: any;
    let checkInterval: any;

    const subscribe = async () => {
      await Accelerometer.setUpdateInterval(1000); // 1s
      sub = Accelerometer.addListener((data) => {
        const g = magnitude(data.x, data.y, data.z);
        // If g not close to 1, we consider it as movement
        if (Math.abs(g - 1) > 0.1) {
          lastMovementRef.current = Date.now();
        }
      });

      checkInterval = setInterval(async () => {
        const now = Date.now();
        const inactiveMs = now - lastMovementRef.current;
        const thresholdMs = 30 * 1000; // 30s for demo

        if (inactiveMs > thresholdMs && canTrigger(lastTriggerRef, thresholdMs)) {
          try {
            const coords = await getCurrentLocation();
            await triggerSos("inactivity", coords);
          } catch (e) {
            console.log("Inactivity SOS failed", e);
          }
        }
      }, 5000);
    };

    subscribe();

    return () => {
      if (sub) sub.remove();
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [enabled]);
}
