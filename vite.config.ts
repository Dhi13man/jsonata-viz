import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["visionata.svg"],
      manifest: {
        name: "Visionata — The JSONata Visualiser",
        short_name: "Visionata",
        description:
          "Interactive visual development environment for JSONata. Build, test, and debug expressions with drag-and-drop. Fully client-side.",
        theme_color: "#0d1117",
        background_color: "#0d1117",
        display: "standalone",
        icons: [
          {
            src: "visionata.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/static\.cloudflareinsights\.com\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-reactflow": ["@xyflow/react", "@dagrejs/dagre"],
          "vendor-jsonata": ["jsonata"],
          "vendor-codemirror": [
            "@uiw/react-codemirror",
            "@codemirror/lang-json",
            "@codemirror/language",
            "@codemirror/view",
            "@codemirror/state",
            "@codemirror/commands",
          ],
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
