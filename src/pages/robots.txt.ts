// robots.txt: preview builds ask every crawler to stay away; the public build allows indexing.
// Author: A097MPRUS.
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const preview = import.meta.env.PUBLIC_SITE_STAGE !== 'public';
  const body = preview ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
