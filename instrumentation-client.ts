import { whenIdle } from "@/lib/idle";

// These SDKs are large, so they load after the page is ready rather than delaying hydration.
// Errors thrown before then are not captured by Crashlytics.
// Each service is isolated so a monitoring failure can't affect the other or the app.
whenIdle(() => {
  void import("@/lib/firebase").then(({ app }) => {
    import("firebase/crashlytics")
      .then(({ getCrashlytics }) => getCrashlytics(app))
      .catch((error) => console.warn("Firebase Crashlytics failed to start", error));
    import("firebase/performance")
      .then(({ getPerformance }) => getPerformance(app))
      .catch((error) => console.warn("Firebase Performance failed to start", error));
  }).catch((error) => console.warn("Firebase failed to load", error));
});
