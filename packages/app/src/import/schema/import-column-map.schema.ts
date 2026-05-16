import { z } from 'zod';

export const ImportColumnMapSchema = z.object({
    toAccount: z.string().min(1),
    category: z.string().min(1),
    operatedAt: z.string().min(1),
    toAmount: z.string().min(1),
    toCurrency: z.string().min(1),
    externalId: z.string(),
    fromAccount: z.string(),
    fromCurrency: z.string(),
    fromAmount: z.string(),
    comment: z.string(),
    isPlanned: z.string(),
    mcc: z.string()
});

export type ImportColumnMapFormValues = z.infer<typeof ImportColumnMapSchema>;
