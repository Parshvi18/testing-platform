import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxying /api means the frontend code never needs to know the backend's
// port in dev; in prod we point VITE_API_URL at the deployed backend instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
