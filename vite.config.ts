import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { vercelPreset } from "@vercel/react-router/vite";
import { excelToJsonPlugin } from "./plugins/excel-to-json";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      proxy: {
        // LMS API
        "/api": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api/, "/api"),
        },
        // TCE Player resources
        "/tceplayer-two": {
          target: env.VITE_TCE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        // TCE Repo API
        "/tce-repo-api": {
          target: env.VITE_TCE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        // TCE Teach API
        "/tce-teach-api": {
          target: env.VITE_TCE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      excelToJsonPlugin(),
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),
    ],
    presets: [vercelPreset()],
  };
});
