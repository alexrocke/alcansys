import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA cleanup: register the kill-switch worker at /sw.js so it replaces any
// old vite-plugin-pwa/Workbox registration, clears its caches, navigates open
// clients to fresh HTML, and then unregisters itself. Without this step the
// old Workbox SW keeps serving stale HTML/chunks in the Lovable preview.
if ("serviceWorker" in navigator) {
  const swPaths = ["/sw.js", "/service-worker.js"];

  // Kick the replacement worker(s) so the browser fetches the new script and
  // the activate handler (which purges old caches + reloads tabs) runs.
  swPaths.forEach((path) => {
    navigator.serviceWorker.register(path).catch(() => {
      /* ignore — path may not have been registered previously */
    });
  });

  // Belt-and-suspenders: if the kill-switch has already unregistered itself
  // on a prior load, make sure no other stale registrations linger.
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => {
      const scriptURL =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        "";
      if (!scriptURL) return;
      // Only touch app-shell workers; leave messaging workers (FCM/OneSignal) alone.
      if (swPaths.some((p) => scriptURL.endsWith(p))) return;
      if (/firebase-messaging-sw|OneSignalSDKWorker/i.test(scriptURL)) return;
      // Unknown worker: don't touch it.
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
