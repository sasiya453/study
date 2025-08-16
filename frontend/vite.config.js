import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deployed to https://sasiya453.github.io/study
export default defineConfig({
  plugins: [react()],
  base: "/study/",
});
