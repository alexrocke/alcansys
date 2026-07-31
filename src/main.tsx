import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA cleanup (idempotent): unregister any leftover app-shell service worker.
// We never (re)register a worker here — doing so caused an install/activate/reload
// loop. Messaging workers (FCM/OneSignal) are left untouched.
if ("serviceWorker" in navigator) {
  const appShellPaths = ["/sw.js", "/service-worker.js"];

  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => {
      const scriptURL =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        "";
      if (!scriptURL) return;
      if (/firebase-messaging-sw|OneSignalSDKWorker/i.test(scriptURL)) return;
      if (appShellPaths.some((p) => new URL(scriptURL).pathname === p)) {
        registration.unregister().catch(() => {
          /* ignore */
        });
      }
    });
  }).catch(() => {
    /* ignore */
  });
}

createRoot(document.getElementById("root")!).render(<App />);
