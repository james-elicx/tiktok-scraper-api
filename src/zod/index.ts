import type { z } from 'zod';

export * from './basic';
export * from './posts';
export * from './user';

export type InferZodType<T> = T extends z.ZodTypeAny ? z.infer<T> : null;
