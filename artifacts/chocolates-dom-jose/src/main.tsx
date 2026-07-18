import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root")!;

// Production pages are prerendered at build time (see scripts/prerender.mjs),
// so the root already has markup to attach to. Dev mode (and any route the
// prerender step doesn't cover) still gets a plain client render.
if (container.hasChildNodes()) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}
