import { useState } from "react";
import { toast } from "sonner";

import type { LatLng } from "@/components/leaflet-map";

/**
 * Acquire the device's position via the browser Geolocation API. The browser
 * handles the source fallback chain itself (GPS → WiFi → cell → IP);
 * `enableHighAccuracy` just biases toward GPS. No external service needed.
 */
export function useGeolocate() {
  const [isLocating, setIsLocating] = useState(false);

  function locate(onLocated: (p: LatLng) => void) {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available on this device.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onLocated({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setIsLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked. Enable it for this site in your browser, and for your browser in your OS location settings."
            : "Couldn't get your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return { locate, isLocating };
}
