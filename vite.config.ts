import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// `npm run dev` serves the demo (index.html); `npm run build` builds the library.
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
});
