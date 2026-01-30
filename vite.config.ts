import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay({
      // Don't show overlay for expected business logic errors
      filter: (error) => {
        // Hide overlay for HTTP 400 errors (bad request/validation errors)
        if (error.message?.includes('400:')) {
          return false;
        }
        // Hide overlay for promo code related errors
        if (error.message?.toLowerCase().includes('promo code')) {
          return false;
        }
        // Hide overlay for validation errors
        if (error.message?.toLowerCase().includes('invalid') && error.message?.includes('400')) {
          return false;
        }
        // Show overlay for all other errors
        return true;
      }
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
