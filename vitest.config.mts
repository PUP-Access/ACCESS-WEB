import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/features/auth/**/*.{ts,tsx}",
        "src/features/users/**/*.{ts,tsx}",
        "src/utils/checkRole.ts",
        "src/proxy.ts",
        "src/components/ui/EditProfileModal.tsx",
      ],
      exclude: [
        "**/*.d.ts",
        "src/**/*.types.ts",
        "src/**/index.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
