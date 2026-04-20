import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // ✅ ADD THIS LINE FOR APACHE
    base: "/convoy/",

    server: {
      host: "::",
      port: Number(env.VITE_DEV_PORT) || 8080,

      // ✅ DEV ONLY – DO NOT REMOVE
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },

    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean,
    ),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    define: {
      "process.env": {
        NODE_ENV: JSON.stringify(mode),
      },
    },
  };
});
