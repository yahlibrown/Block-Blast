// The error log's on-screen panel (see `../debug/errorLog`). Imported first by
// main.ts so it also catches errors thrown while the rest of the shell starts.
import { startErrorLog } from "../debug/errorLog";

let panel: HTMLElement | null = null;

startErrorLog({
  search: location.search,
  target: window,
  show(line) {
    if (!panel) {
      panel = document.createElement("pre");
      panel.className = "error-log";
      document.body.append(panel);
    }
    const entry = document.createElement("div");
    entry.textContent = line;
    panel.append(entry);
    panel.scrollTop = panel.scrollHeight;
  },
});
