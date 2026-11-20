import type { APIRoute } from 'astro';

const root = (import.meta.env.PUBLIC_SITE_URL || 'https://your-project.vercel.app')
  .replace(/\/+$/, '');

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${root}/sitemap.xml`,
      ''
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
