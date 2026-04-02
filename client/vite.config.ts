import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Dev-only: where Vite proxies `/api` (not sent to the browser). Override with API_PROXY_TARGET in .env */
const devApiProxy = process.env.API_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: devApiProxy,
        changeOrigin: true,
      },
    },
  },
});
