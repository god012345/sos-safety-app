// src/hooks/useSensorSos.ts
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";

/**
 * Calculate acceleration magnitude
 */
function magnitude(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Cooldown helper to avoid repeated triggers
 */
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
 * SHAKE DETECTION
 * Triggers when strong acceleration detected
 */
export function useShakeToSos(
  enabled: boolean = true,
  onShake?: () => void
) {
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onShake) return;

    let subscription: any;

    const subscribe = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) return;

      Accelerometer.setUpdateInterval(200); // 200ms
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const g = magnitude(x, y, z); // ~1g at rest

        if (g > 2.2 && canTrigger(lastTriggerRef, 6000)) {
          onShake();
        }
      });
    };

    subscribe();

    return () => {
      subscription?.remove();
    };
  }, [enabled, onShake]);
}

/**
 * FALL DETECTION
 * Detects near free-fall followed by strong impact
 */
export function useFallDetectionSos(
  enabled: boolean = true,
  onFall?: () => void
) {
  const lastTriggerRef = useRef(0);
  const prevMagRef = useRef(1);

  useEffect(() => {
    if (!enabled || !onFall) return;

    let subscription: any;

    const subscribe = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) return;

      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const g = magnitude(x, y, z);
        const prev = prevMagRef.current;
        prevMagRef.current = g;

        const freeFall = prev < 0.3;
        const hardImpact = g > 2.8;

        if (freeFall && hardImpact && canTrigger(lastTriggerRef, 10000)) {
          onFall();
        }
      });
    };

    subscribe();

    return () => {
      subscription?.remove();
    };
  }, [enabled, onFall]);
}

/**
 * INACTIVITY DETECTION
 * No movement for threshold time → SOS
 */
export function useInactivitySos(
  enabled: boolean = false,
  onInactivity?: () => void
) {
  const lastMovementRef = useRef(Date.now());
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onInactivity) return;

    let subscription: any;
    let intervalId: any;

    const subscribe = async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) return;

      Accelerometer.setUpdateInterval(1000); // 1s
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const g = magnitude(x, y, z);
        if (Math.abs(g - 1) > 0.1) {
          lastMovementRef.current = Date.now();
        }
      });

      intervalId = setInterval(() => {
        const now = Date.now();
        const inactiveMs = now - lastMovementRef.current;
        const thresholdMs = 30 * 1000; // 30s (demo)

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
      subscription?.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, onInactivity]);
}
