import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RECOVERY_KEY = "xpose_chunk_recovery_v1";
const CHUNK_RECOVERY_WINDOW_MS = 15000;

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

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  recoverFromStaleChunk(String(reason?.message || reason || ""));
});

window.addEventListener("error", (event) => {
  recoverFromStaleChunk(String(event.message || ""));
});

createRoot(document.getElementById("root")!).render(<App />);
