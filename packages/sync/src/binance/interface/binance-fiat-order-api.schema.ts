import { z } from 'zod';

const BinanceFiatOrderApiSchema = z.object({
    orderNo: z.string(),
    fiatCurrency: z.string(),
    amount: z.string(),
    totalFee: z.string(),
    status: z.string(),
    createTime: z.number()
});

export const BinanceFiatOrderListApiSchema = z.object({
    code: z.string(),
    message: z.string(),
    data: z.array(BinanceFiatOrderApiSchema),
    total: z.number(),
    success: z.boolean()
});

export type BinanceFiatOrderApiInterface = z.infer<typeof BinanceFiatOrderApiSchema>;
