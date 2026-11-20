import { defineConfig } from 'astro/config';

/**
 * Static output only. There is no server runtime on content pages:
 * Vercel serves dist/ from the edge network. The contact endpoint is a
 * standalone Vercel Function in /api, so no Astro adapter is required.
 */
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto'
  },
  trailingSlash: 'never',
  compressHTML: true,
  scopedStyleStrategy: 'where',
  vite: {
    build: {
      cssCodeSplit: false
    }
  }
});
