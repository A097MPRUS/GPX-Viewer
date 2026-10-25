// Documentation ordering and search index. Author: A097MPRUS.
import { getCollection, type CollectionEntry } from 'astro:content';

export const SECTIONS = ['Start', 'Using GPX Viewer', 'Reference', 'Project'] as const;

export async function allDocs(): Promise<CollectionEntry<'docs'>[]> {
  const docs = await getCollection('docs');
  return docs.sort(
    (a, b) =>
      SECTIONS.indexOf(a.data.section) - SECTIONS.indexOf(b.data.section) ||
      a.data.order - b.data.order,
  );
}

/** Plain text of a Markdown body for the client-side search (no HTML involved). */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>|]/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
