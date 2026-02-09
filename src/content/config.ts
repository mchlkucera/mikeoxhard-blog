import { defineCollection, z } from 'astro:content';

const italyCollection = defineCollection({
  type: 'content',
  schema: z.object({
    layout: z.string().optional(),
    date: z.coerce.date().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
});

const defaultCollection = defineCollection({
  type: 'content',
  schema: z.object({
    layout: z.string().optional(),
    date: z.coerce.date().optional(),
    title: z.string().optional(),
  }),
});

export const collections = {
  italy: italyCollection,
  default: defaultCollection,
};
