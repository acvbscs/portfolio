import type { APIRoute } from 'astro';

const root = (import.meta.env.PUBLIC_SITE_URL || 'https://your-project.vercel.app')
  .replace(/\/+$/, '');

// /404 is deliberately absent: it is served with noindex.
const routes = [
  { path: '/', priority: '1.0' },
  { path: '/colophon', priority: '0.4' },
  { path: '/privacy', priority: '0.3' }
];

export const GET: APIRoute = () => {
  const entries = routes
    .map(
      (route) =>
        `  <url><loc>${root}${route.path}</loc><changefreq>monthly</changefreq><priority>${route.priority}</priority></url>`
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
