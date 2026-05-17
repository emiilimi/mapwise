import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Bygger den selvinneholdte viewer-bundlen. Output havner i public/ slik
// at Vite-editor-buildet kopierer den til dist/, og at dev-serveren
// serverer den på /mapshow-viewer.js. Hele bundelen er IIFE — ingen
// externals — så HTML-eksport kan inline den med ett enkelt <script>.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // outDir == public ville ellers kollidere med default publicDir.
  publicDir: false,
  // Vite i lib-modus erstatter ikke process.env.NODE_ENV automatisk.
  // Uten dette ender React/avhengigheter med å sjekke en undefined `process`
  // i nettleseren og krasje (Uncaught ReferenceError: process is not defined).
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: "viewer/main.tsx",
      name: "MapShowViewer",
      formats: ["iife"],
      fileName: () => "mapshow-viewer.js",
    },
    rollupOptions: {
      // Ingen externals: alt skal være i én fil.
      external: [],
      output: {
        inlineDynamicImports: true,
        assetFileNames: (info) => {
          if (info.names?.some((n) => n.endsWith(".css")))
            return "mapshow-viewer.css";
          return "mapshow-viewer.[ext]";
        },
      },
    },
  },
});
