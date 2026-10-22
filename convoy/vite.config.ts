
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Read configuration from .env
  const apiUrl = new URL(env.VITE_API_BASE_URL);
  const devHost = env.VITE_DEV_HOST || "localhost";
  const devPort = Number(env.VITE_DEV_PORT) || 8080;

  // Build CSP connect-src dynamically
  const connectSrc = [
    "'self'",
    apiUrl.origin,
    `ws://${devHost}:${devPort}`,
  ].join(" ");

  return {
    // Application base path
    base: "/convoy",

    server: {
      host: devHost,
      port: devPort,

      // Development CSP: report violations without blocking resources
      headers: {
          "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
"Content-Security-Policy-Report-Only":
"default-src 'self'; " +
          "base-uri 'self'; " +
          "object-src 'none'; " +
          "frame-ancestors 'self'; " +
          "form-action 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: https:; " +
          "font-src 'self' data: https:; " +
          `connect-src ${connectSrc};`,
      },

      // Development API proxy
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },

    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),

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
