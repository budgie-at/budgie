import { z } from 'zod';

export const MonobankAccountApiSchema = z.object({
    id: z.string(),
    sendId: z.string(),
    currencyCode: z.number(),
    cashbackType: z.string(),
    balance: z.number(),
    creditLimit: z.number(),
    maskedPan: z.array(z.string()),
    type: z.string(),
    iban: z.string()
});
