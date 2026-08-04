import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    headers: {
      "Cache-Control": "no-store",
    },
  },
});
