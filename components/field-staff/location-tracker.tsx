"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import toast from "react-hot-toast";

const REPORT_INTERVAL_MS = 30_000;

type BrowserBattery = {
  level?: number;
};

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BrowserBattery>;
};

export function FieldStaffLocationTracker() {
  const { user, loading, hasPermission } = useAuth();
  const lastReportAt = useRef(0);
  const permissionToastShown = useRef(false);

  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;
  const normalizedRole = String(roleName || "").toLowerCase();
  const shouldTrack =
    normalizedRole.includes("field staff") ||
    normalizedRole.includes("field_staff") ||
    hasPermission("gps_submit_own");

  useEffect(() => {
    if (loading || !user || !shouldTrack || typeof navigator === "undefined") return;

    if (!navigator.geolocation) {
      if (!permissionToastShown.current) {
        permissionToastShown.current = true;
        toast.error("This browser does not support GPS location tracking.");
      }
      return;
    }

    let stopped = false;

    const reportPosition = async (position: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastReportAt.current < REPORT_INTERVAL_MS) return;
      lastReportAt.current = now;

      let battery: number | undefined;
      try {
        const batteryManager = await (navigator as NavigatorWithBattery).getBattery?.();
        if (typeof batteryManager?.level === "number") {
          battery = Math.round(batteryManager.level * 100);
        }
      } catch {
        // Battery information is optional and unavailable in some browsers.
      }

      const coordinates = position.coords;
      await apiRequest("/gps/update", {
        method: "POST",
        suppressToast: true,
        body: JSON.stringify({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: coordinates.accuracy,
          altitude: coordinates.altitude,
          speed: coordinates.speed,
          heading: coordinates.heading,
          battery,
          deviceTimestamp: new Date(position.timestamp).toISOString(),
          permissionStatus: "GRANTED",
        }),
      }).catch((error) => {
        console.error("[Field Staff GPS] Failed to report location:", error);
      });
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      if (stopped || permissionToastShown.current) return;
      permissionToastShown.current = true;
      const message =
        error.code === error.PERMISSION_DENIED
          ? "Location access is required for field staff. Enable Location permission for this site in your browser."
          : "Unable to obtain your GPS location. Check that device location services are enabled.";
      toast.error(message, { duration: 10_000 });
    };

    const watchId = navigator.geolocation.watchPosition(
      reportPosition,
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 20_000,
      }
    );

    const refreshPosition = () => {
      if (document.visibilityState !== "visible") return;
      navigator.geolocation.getCurrentPosition(
        reportPosition,
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 10_000,
          timeout: 20_000,
        }
      );
    };

    window.addEventListener("focus", refreshPosition);
    document.addEventListener("visibilitychange", refreshPosition);

    return () => {
      stopped = true;
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("focus", refreshPosition);
      document.removeEventListener("visibilitychange", refreshPosition);
    };
  }, [hasPermission, loading, shouldTrack, user]);

  return null;
}
