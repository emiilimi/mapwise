import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Editor-entry kun for nå. Viewer-entry (mapshow-viewer.js) legges til i Steg 12.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
