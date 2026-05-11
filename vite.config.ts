import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { excelToJsonPlugin } from "./plugins/excel-to-json";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      proxy: {
        // LMS API: handled by the BFF proxy route at app/routes/api.proxy.tsx
        // (injects Authorization: Bearer from HttpOnly cookie). Do not add a
        // vite proxy for /api here, or it would short-circuit the BFF.
        "/ce-static": {
          target: env.VITE_TCE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
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
    ssr: {
      noExternal: ["@heroui/react", "@heroui/styles", "react-aria-components"],
    },
    plugins: [
      excelToJsonPlugin(),
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),
    ],
  };
});
