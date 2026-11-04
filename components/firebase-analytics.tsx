"use client";

import { useEffect } from "react";
import { app } from "@/lib/firebase";

// Analytics needs browser APIs, so it is loaded only after mount and only where supported
export function FirebaseAnalytics() {
  useEffect(() => {
    import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => {
        if (await isSupported()) getAnalytics(app);
      })
      .catch((error) => console.warn("Firebase Analytics failed to load", error));
  }, []);

  return null;
}
