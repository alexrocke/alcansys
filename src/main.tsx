import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA cleanup: the old app-shell service worker was serving stale HTML/chunks.
// Keep home-screen manifest/icons, but remove app-shell registrations everywhere.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

const shouldCleanAppShellWorker = isPreviewHost || isInIframe || window.location.search.includes("sw=off") || true;

if (shouldCleanAppShellWorker) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations
      .filter((registration) => {
        try {
          const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || "";
          return scriptURL.endsWith("/sw.js") || scriptURL.endsWith("/service-worker.js");
        } catch {
          return false;
        }
      })
      .forEach((registration) => registration.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
