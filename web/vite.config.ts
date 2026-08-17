/// <reference types="vitest/config" />
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // `pnpm build && open stats.html` — bundle budget তদন্তের জন্য (docs/05 §12)
    visualizer({ filename: 'stats.html', gzipSize: true, template: 'treemap' }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    // Dev-এ MSW ব্যবহার হলে proxy নিষ্ক্রিয় থাকে (VITE_API_MOCKING=enabled)
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: mode !== 'production' ? true : 'hidden',
    target: 'es2022',
    rollupOptions: {
      output: {
        // Vendor split — route chunk-কে budget-এর মধ্যে রাখতে (docs/05 §12)
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    /**
     * Vitest-এর default ৫ সেকেন্ড এই suite-এর জন্য আর যথেষ্ট নয়।
     *
     * এখানকার test গুলো unit নয় — প্রতিটিতে MSW handler, react-query-র
     * fetch চক্র, debounced ইনপুট (৩০০ms) ও Radix-এর portal মিলিয়ে আসল
     * সময় লাগে। একা চালালে সবচেয়ে ভারী test ~১.৭s, কিন্তু ২০টি file
     * সমান্তরালে চললে worker গুলো CPU ভাগ করে নেয় এবং সেটিই ৫s ছাড়িয়ে
     * যায়। সীমা বাড়ানো হয়েছে যাতে ব্যর্থতা মানে সত্যিই ভাঙা কোড, শুধু
     * ব্যস্ত মেশিন নয় — ধীর test আলাদা করে চেনা যায় duration রিপোর্টে।
     */
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx'],
    },
  },
}));
