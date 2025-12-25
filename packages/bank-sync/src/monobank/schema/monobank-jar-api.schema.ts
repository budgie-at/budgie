import { z } from 'zod';

export const MonobankJarApiSchema = z.object({
    id: z.string(),
    sendId: z.string(),
    title: z.string(),
    description: z.string(),
    currencyCode: z.number(),
    balance: z.number(),
    goal: z.number()
});
