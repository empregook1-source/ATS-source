// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from 'nuxt/config'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "https://empregook.com.br";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  site: {
    url: siteUrl,
  },

  modules: [
    "@nuxtjs/mdc",
    "@nuxtjs/sitemap",
  ],

  sitemap: {
    sources: [
      '/api/__sitemap__/urls'
    ],
    urls: [
      {
        loc: '/',
        changefreq: 'daily',
        priority: 1,
      },
    ],
  },

  css: ["~/assets/css/main.css"],

  sourcemap: { 
    server: false,
    client: false 
   },

  // ─────────────────────────────────────────────
  // Global <head> — lang, title template, favicon
  // ─────────────────────────────────────────────
  app: {
    head: {
      titleTemplate: "%s — Emprego OK",
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
      ],
      meta: [
        { name: "theme-color", content: "#09090b" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0, maximum-scale=5.0",
        },
      ],
      // Plausible removed — PostHog handles all analytics
    },
  },

  runtimeConfig: {
    public: {
      /** Base URL of the marketing site (matrix-web) for cross-domain links */
      marketingUrl:
        process.env.NUXT_PUBLIC_MARKETING_URL || "https://empregook.com.br",
      /** Cookie domain for cross-subdomain sharing (e.g. '.empregook.com.br') */
      cookieDomain: process.env.NUXT_PUBLIC_COOKIE_DOMAIN || "",
      /** Whether in-app feedback via GitHub Issues is enabled */
      feedbackEnabled: !!(
        process.env.GITHUB_FEEDBACK_TOKEN && process.env.GITHUB_FEEDBACK_REPO
      ),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // ─────────────────────────────────────────────
  // Route rules — ISR for public job pages
  // ─────────────────────────────────────────────
  routeRules: {
    "/vagas": { isr: 3600 },
    "/vagas/**": { isr: 3600 },
    "/jobs": { redirect: { to: "/vagas", statusCode: 301 } },
  },

  nitro: {
    routeRules: {
      "/**": {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "X-XSS-Protection": "1; mode=block",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
          "Strict-Transport-Security":
            "max-age=63072000; includeSubDomains; preload",
          // Block indexing for all non-public routes by default;
          // overridden below for /vagas/** which should be indexable.
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
      "/": {
        headers: {
          "X-Robots-Tag": "index, follow",
        },
      },
      "/robots.txt": {
        headers: {
          "X-Robots-Tag": "index, follow",
        },
      },
      "/sitemap.xml": {
        headers: {
          "X-Robots-Tag": "index, follow",
        },
      },
      // Public job board pages — allow indexing
      "/vagas/**": {
        headers: {
          "X-Robots-Tag": "index, follow",
        },
      },
      "/vagas": {
        headers: {
          "X-Robots-Tag": "index, follow",
        },
      },
    },
  },
});
