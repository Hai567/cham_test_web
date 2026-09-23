/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run build:single` tạo một file HTML duy nhất (hash router) để demo offline
// hoặc host tĩnh mà không cần cấu hình rewrite.
// `npm run dev:phone` chạy HTTPS trong mạng LAN: camera trên điện thoại chỉ mở được qua HTTPS.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : []), ...(mode === 'https' ? [basicSsl()] : [])],
  define: {
    __HASH_ROUTER__: JSON.stringify(mode === 'single'),
  },
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}));
