"use client";

import { useEffect } from "react";
import { whenIdle } from "@/lib/idle";

// Analytics needs browser APIs, so it loads only once the page is idle and only where supported
export function FirebaseAnalytics() {
  useEffect(() => whenIdle(() => {
    Promise.all([import("firebase/analytics"), import("@/lib/firebase")])
      .then(async ([{ getAnalytics, isSupported }, { app }]) => {
        if (await isSupported()) getAnalytics(app);
      })
      .catch((error) => console.warn("Firebase Analytics failed to load", error));
  }), []);

  return null;
}
