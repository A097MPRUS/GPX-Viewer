// robots.txt: preview builds ask every crawler to stay away; the public build allows indexing and
// names the sitemap.
// Author: A097MPRUS.
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const preview = import.meta.env.PUBLIC_SITE_STAGE !== 'public';
  const sitemap = new URL('sitemap.xml', new URL(import.meta.env.BASE_URL, import.meta.env.SITE))
    .href;
  const body = preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
