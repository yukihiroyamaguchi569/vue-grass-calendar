import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// `npm run dev` serves the demo (index.html); `npm run build` builds the library.
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      // The sample data has its own entry so that it stays out of the main bundle.
      entry: { index: 'src/index.ts', sample: 'src/sample.ts' },
      formats: ['es'],
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
});
