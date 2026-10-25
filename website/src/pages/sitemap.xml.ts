// sitemap.xml: every page of the website with its canonical address on the one official host.
// Author: A097MPRUS.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const PAGES = [
  '',
  'explore/',
  'viewer/',
  'downloads/',
  'docs/',
  'changelog/',
  'privacy/',
  'legal/',
];

export const GET: APIRoute = async ({ site }) => {
  const root = new URL(import.meta.env.BASE_URL, site);
  const docs = (await getCollection('docs')).map((d) => `docs/${d.id}/`);
  const urls = [...PAGES, ...docs].map((p) => new URL(p, root).href);
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
