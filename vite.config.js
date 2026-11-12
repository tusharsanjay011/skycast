import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base lets the build run cleanly on both GitHub Pages subpaths and Vercel root domains.
  base: "./",
  server: {
    port: 5173,
  },
});
