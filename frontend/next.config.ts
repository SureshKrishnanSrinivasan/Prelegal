import path from "node:path";
import type { NextConfig } from "next";

/** Repo root: lets the app import the shared templates/ directory alongside frontend/. */
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      // Templates are bundled as strings at build time, so they ship with the app.
      "*.md": {
        type: "raw",
      },
    },
  },
};

export default nextConfig;
