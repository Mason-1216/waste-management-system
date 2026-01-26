import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3000';

const chunkGroups = [
  { name: 'vue-core', packages: ['vue', 'vue-router', 'pinia'] },
  { name: 'element-plus', packages: ['element-plus', '@element-plus/icons-vue'] },
  { name: 'echarts', packages: ['echarts'] },
  { name: 'xlsx', packages: ['xlsx'] }
];

const normalizePath = (value) => value.replace(/\\/g, '/');

const resolveChunk = (id) => {
  const normalizedId = normalizePath(id);
  if (!normalizedId.includes('/node_modules/')) {
    return;
  }
  if (normalizedId.includes('/node_modules/@vue/')) {
    return 'vue-core';
  }
  for (const group of chunkGroups) {
    if (group.packages.some((pkg) => normalizedId.includes(`/node_modules/${pkg}/`))) {
      return group.name;
    }
  }
  return;
};

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: '运行项目管理系统',
        short_name: '运行管理',
        description: '垃圾处理站点运行项目管理系统',
        theme_color: '#409EFF',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html'
      }
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      },
      '/socket.io': {
        target: apiTarget,
        ws: true
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
        manualChunks: (id) => resolveChunk(id)
      }
    }
  }
});
