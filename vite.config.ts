import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Editor-appen. Viewer-bundelen (mapshow-viewer.js) bygges separat via
// vite.viewer.config.ts og havner i public/.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
