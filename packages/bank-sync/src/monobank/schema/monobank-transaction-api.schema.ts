import { z } from 'zod';

export const MonobankTransactionApiSchema = z.object({
    id: z.string(),
    time: z.number(),
    description: z.string(),
    mcc: z.number(),
    originalMcc: z.number(),
    amount: z.number(),
    operationAmount: z.number(),
    currencyCode: z.number(),
    commissionRate: z.number(),
    cashbackAmount: z.number(),
    balance: z.number(),
    hold: z.boolean(),
    receiptId: z.string().optional(),
    invoiceId: z.string().optional(),
    counterEdrpou: z.string().optional(),
    counterIban: z.string().optional(),
    counterName: z.string().optional(),
    comment: z.string().optional()
});

export const MonobankTransactionListApiSchema = z.array(MonobankTransactionApiSchema);
