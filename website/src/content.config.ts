// Documentation collection. Author: A097MPRUS.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(['Start', 'Using GPX Viewer', 'Reference', 'Project']),
    order: z.number(),
    updated: z.string(),
    /** First release with the feature described; shown as in preparation until it is published. */
    release: z.string().optional(),
  }),
});

export const collections = { docs };
