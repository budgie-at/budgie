import { z } from 'zod';

const BinanceC2cOrderApiSchema = z.object({
    orderNumber: z.string(),
    tradeType: z.string(),
    asset: z.string(),
    fiat: z.string(),
    amount: z.string(),
    totalPrice: z.string(),
    unitPrice: z.string(),
    orderStatus: z.string(),
    createTime: z.number(),
    takerCommission: z.string()
});

export const BinanceC2cOrderListApiSchema = z.object({
    code: z.string(),
    message: z.string(),
    data: z.array(BinanceC2cOrderApiSchema),
    total: z.number(),
    success: z.boolean()
});

export const BinanceC2cResponseStatusApiSchema = z.object({
    code: z.union([z.string(), z.number()]),
    message: z.string(),
    success: z.boolean()
});

export const BinanceC2cResponseShapeApiSchema = z.object({
    data: z.array(z.record(z.string(), z.unknown()))
});

export type BinanceC2cOrderApiInterface = z.infer<typeof BinanceC2cOrderApiSchema>;
