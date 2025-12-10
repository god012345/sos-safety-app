// src/hooks/useSensorSos.ts
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";

function magnitude(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

function canTrigger(
  lastRef: React.MutableRefObject<number>,
  cooldownMs: number
) {
  const now = Date.now();
  if (now - lastRef.current < cooldownMs) return false;
  lastRef.current = now;
  return true;
}

/**
 * Shake detector hook:
 * Only detects shakes and calls `onShake`.
 */
export function useShakeToSos(
  enabled: boolean = true,
  onShake?: () => void
) {
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onShake) return;

    let sub: any;

    const subscribe = async () => {
      await Accelerometer.setUpdateInterval(200); // every 200ms
      sub = Accelerometer.addListener((data) => {
        const g = magnitude(data.x, data.y, data.z); // ~1g at rest

        if (g > 2.2 && canTrigger(lastTriggerRef, 6000)) {
          onShake();
        }
      });
    };

    subscribe();

    return () => {
      if (sub) sub.remove();
    };
  }, [enabled, onShake]);
}

/**
 * Fall detection hook:
 * Simple heuristic: near free-fall + strong impact.
 * Calls `onFall()` when pattern is detected.
 */
export function useFallDetectionSos(
  enabled: boolean = true,
  onFall?: () => void
) {
  const lastTriggerRef = useRef(0);
  const previousMagRef = useRef(1);

  useEffect(() => {
    if (!enabled || !onFall) return;

    let sub: any;

    const subscribe = async () => {
      await Accelerometer.setUpdateInterval(100);
      sub = Accelerometer.addListener((data) => {
        const g = magnitude(data.x, data.y, data.z);
        const prev = previousMagRef.current;
        previousMagRef.current = g;

        const freeFall = prev < 0.3; // almost weightless
        const hardImpact = g > 2.8; // strong hit

        if (freeFall && hardImpact && canTrigger(lastTriggerRef, 10000)) {
          onFall();
        }
      });
    };

    subscribe();

    return () => {
      if (sub) sub.remove();
    };
  }, [enabled, onFall]);
}

/**
 * Inactivity detection hook:
 * No significant movement for some time -> calls `onInactivity`.
 */
export function useInactivitySos(
  enabled: boolean = false,
  onInactivity?: () => void
) {
  const lastMovementRef = useRef(Date.now());
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onInactivity) return;

    let sub: any;
    let checkInterval: any;

    const subscribe = async () => {
      await Accelerometer.setUpdateInterval(1000); // every 1s
      sub = Accelerometer.addListener((data) => {
        const g = magnitude(data.x, data.y, data.z);
        if (Math.abs(g - 1) > 0.1) {
          lastMovementRef.current = Date.now();
        }
      });

      checkInterval = setInterval(() => {
        const now = Date.now();
        const inactiveMs = now - lastMovementRef.current;
        const thresholdMs = 30 * 1000; // 30s demo

        if (
          inactiveMs > thresholdMs &&
          canTrigger(lastTriggerRef, thresholdMs)
        ) {
          onInactivity();
        }
      }, 5000);
    };

    subscribe();

    return () => {
      if (sub) sub.remove();
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [enabled, onInactivity]);
}
