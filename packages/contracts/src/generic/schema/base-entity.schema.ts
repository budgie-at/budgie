import { z } from 'zod';

export const BaseEntitySchema = z.object({
    id: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable()
});
