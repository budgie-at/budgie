import type { ZodDate, ZodNumber } from 'zod';

export interface BaseOverridesInterface {
    readonly id: (schema: ZodNumber) => ZodNumber;
    readonly createdAt: (schema: ZodDate) => ZodDate;
    readonly updatedAt: (schema: ZodDate) => ZodDate;
    readonly deletedAt: (schema: ZodDate) => ZodDate;
}
