
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // Use Babel instead of SWC to avoid WASM issues
      jsxRuntime: 'automatic',
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configure esbuild to avoid WASM issues
  esbuild: {
    target: 'es2020',
    format: 'esm',
    platform: 'browser',
  },
  // Optimize dependencies to avoid problematic packages
  optimizeDeps: {
    exclude: ['esbuild-wasm', '@swc/wasm', '@rollup/wasm-node'],
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  // Configure build to use JS-only alternatives
  build: {
    target: 'es2020',
    rollupOptions: {
      external: ['esbuild-wasm']
    }
  }
}));
