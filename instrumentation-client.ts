import { getCrashlytics } from "firebase/crashlytics";
import { getPerformance } from "firebase/performance";
import { app } from "@/lib/firebase";

// Runs in the browser before hydration, so early errors and page load timings are captured.
// Each service is isolated so a monitoring failure can't affect the other or the app.
try {
  getCrashlytics(app);
} catch (error) {
  console.warn("Firebase Crashlytics failed to start", error);
}

try {
  getPerformance(app);
} catch (error) {
  console.warn("Firebase Performance failed to start", error);
}
