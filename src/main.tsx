import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RECOVERY_KEY = "xpose_chunk_recovery_v1";
const CHUNK_RECOVERY_WINDOW_MS = 15000;
const SW_CLEANUP_KEY = "xpose_sw_cleanup_v1";

function recoverFromStaleChunk(message: string) {
  if (!/dynamically imported module|importing a module script failed|failed to fetch dynamically imported module|mime type of "text\/html"/i.test(message)) return;
  try {
    const previous = Number(sessionStorage.getItem(CHUNK_RECOVERY_KEY) || 0);
    const now = Date.now();
    if (previous && now - previous < CHUNK_RECOVERY_WINDOW_MS) return;
    sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(now));
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

async function removeLegacyServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const ours = registrations.filter((registration) => {
      try {
        return new URL(registration.scope).origin === window.location.origin;
      } catch {
        return false;
      }
    });

    if (!ours.length) return;

    await Promise.all(ours.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("xpose-shell-"))
          .map((key) => caches.delete(key))
      );
    }

    // The old worker may have controlled this tab already. Reload once so
    // Chrome starts the page without the legacy service-worker fetch handler.
    if (!sessionStorage.getItem(SW_CLEANUP_KEY)) {
      sessionStorage.setItem(SW_CLEANUP_KEY, "1");
      window.location.reload();
    }
  } catch (error) {
    console.warn("XPOSE legacy service worker cleanup failed:", error);
  }
}

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  recoverFromStaleChunk(String(reason?.message || reason || ""));
});

window.addEventListener("error", (event) => {
  recoverFromStaleChunk(String(event.message || ""));
});

// The storefront does not need a service worker for normal operation.
// Remove legacy registrations so Vite asset preloads are handled directly
// by the browser instead of being intercepted by an old worker.
if (import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void removeLegacyServiceWorker();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
