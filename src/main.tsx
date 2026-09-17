import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RECOVERY_KEY = "xpose_chunk_recovery_v1";

function recoverFromStaleChunk(message: string) {
  if (!/dynamically imported module|importing a module script failed|failed to fetch dynamically imported module|mime type of "text\/html"/i.test(message)) return;
  try {
    if (sessionStorage.getItem(CHUNK_RECOVERY_KEY) === "1") return;
    sessionStorage.setItem(CHUNK_RECOVERY_KEY, "1");
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

try {
  sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
