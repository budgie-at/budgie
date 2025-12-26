import type { ZodDate, ZodNumber } from 'zod';

interface BaseOverrides {
    id: (schema: ZodNumber) => ZodNumber;
    createdAt: (schema: ZodDate) => ZodDate;
    updatedAt: (schema: ZodDate) => ZodDate;
    deletedAt: (schema: ZodDate) => ZodDate;
}

export const BaseEntityFields: BaseOverrides = {
    id: schema => schema.describe('The id of the entity.'),
    createdAt: schema => schema.describe('The creation date of the entity.'),
    updatedAt: schema => schema.describe('The last update date of the entity.'),
    deletedAt: schema => schema.describe('The deletion date of the entity (null if not deleted).')
};
