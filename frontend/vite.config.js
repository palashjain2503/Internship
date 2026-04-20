import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: "/LiveCase.ai.html",
    proxy: {
      "/api": "http://127.0.0.1:5000"
    }
  },
  build: {
    rollupOptions: {
      input: "LiveCase.ai.html"
    }
  }
});
