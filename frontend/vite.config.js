import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    open: "/LiveCase.ai.html",
    allowedHosts: [
      "palestinian-contain-utah-rush.trycloudflare.com",
      "unwrap-separate-ipod-laser.trycloudflare.com"
    ],
    proxy: {
      "/api": "http://127.0.0.1:5050",
      "/socket.io": {
        target: "ws://127.0.0.1:5050",
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: "LiveCase.ai.html"
    }
  }
});