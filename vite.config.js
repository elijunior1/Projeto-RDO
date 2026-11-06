
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // Modo "prompt" (não o "autoUpdate"): ao voltar/sair e voltar,
      // o navegador NÃO troca a versão forçando reload no meio do uso.
      // O usuário é avisado primeiro e só atualiza com confirmação.
      registerType: "prompt",

      // Evita ativar o service worker no ambiente de desenvolvimento.
      devOptions: {
        enabled: false
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // "false" é essencial no modo prompt: a nova versão só entra
        // depois que o usuário aceita (ver main.jsx), para não
        // interromper quem está preenchendo um RDO.
        skipWaiting: false,
        globPatterns: [
          "**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}"
        ]
      },

      manifest: {
        name: "Projeto RDO",
        short_name: "RDO",
        description: "Relatório Diário de Obras",
        theme_color: "#f59e0b",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
