import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  devToolbar: { enabled: false },
  integrations: [react()],
  output: "server",
  vite: {
    server: {
      allowedHosts: [".trycloudflare.com"]
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    }
  }
});
