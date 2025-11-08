import { z } from 'zod';

export const convertToCreateEntitySchema = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
    schema.omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
