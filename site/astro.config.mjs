// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Public site URL. Overridable via SITE_URL for previews / custom domain.
const site = process.env.SITE_URL || "https://watch-catalog-c0c.pages.dev";

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "ignore",
  vite: { plugins: [tailwind()] },
  integrations: [sitemap()],
});
