import { defineConfig, loadEnv } from 'vite'
import { visualizer } from "rollup-plugin-visualizer";
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Muat env file berdasarkan 'mode' (development, production, dll.)
  // npm run dev -> development, npm run build -> production
  // process.cwd() adalah direktori akar proyek Anda
  // .env.[mode].local (Prioritas tertinggi)
  // .env.[mode]
  // .env.local
  // .env (Prioritas terendah)
  const env = loadEnv(mode, process.cwd(), '');

  // Cek apakah kita sedang di mode production
  const isProduction = mode === 'production';

  const check = env.VITE_CHECK;
  if (!check) throw new Error("env is not detected");
  console.log("Berhasil env:", check)

  return {
    // Sekarang Anda bisa menggunakan variabel env di sini jika butuh, 
    // misalnya untuk mengganti port secara dinamis:
    build: {
      // Sourcemap menyala hanya jika BUKAN production
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 1. Markdown Core
            if (id.includes('node_modules/react-markdown') || id.includes('node_modules/vfile') || id.includes('node_modules/unified')) {
              return 'markdown-core';
            }

            // 2. Syntax Highlighter
            if (id.includes('node_modules/highlight.js')) {
              return 'hljs-bundle';
            }

            // 3. UI Components (Radix, Lucide, Sonner)
            // Lucide seringkali sangat besar jika tidak ter-tree-shake dengan benar
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor';
            }

            // 4. React Core (React, React-DOM, Router)
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-core';
            }

            // 5. Sisa Library lainnya
            if (id.includes('node_modules')) {
              return 'vendor-others';
            }
          }
        }
      }
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:3000",
          changeOrigin: true
        },
      }
    }
  }
})
