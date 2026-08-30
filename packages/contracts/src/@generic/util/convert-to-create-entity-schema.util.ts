import { z } from 'zod';

export const convertToCreateEntitySchema = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) => {
    const { id, createdAt, updatedAt, deletedAt, ...createShape } = schema.shape;

    return z.object<Omit<TShape, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>(createShape);
};
