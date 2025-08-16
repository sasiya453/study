import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If deploying to GitHub Pages at https://username.github.io/repo,
// set base: "/repo/". For root user page, keep "/".
export default defineConfig({
  plugins: [react()],
  base: "/", // change to "/your-repo-name/" when using GH Pages project site
});