import { defineConfig } from "vite"
import reactRefresh from "@vitejs/plugin-react-refresh"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    outDir: "www",
  },
  css: {
    modules: {
      localsConvention: "dashesOnly",
    },
  },
  resolve: {
    alias: {
      "~@rocketmakers": path.resolve("./node_modules/@rocketmakers"),
    },
  },
  optimizeDeps: {
    exclude: ["@rocketmakers/api-hooks"],
  },
})
