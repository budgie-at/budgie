import { z } from 'zod';

const BinanceTradeApiSchema = z.object({
    symbol: z.string(),
    id: z.number(),
    orderId: z.number(),
    price: z.string(),
    qty: z.string(),
    quoteQty: z.string(),
    commission: z.string(),
    commissionAsset: z.string(),
    time: z.number(),
    isBuyer: z.boolean(),
    isMaker: z.boolean()
});

export const BinanceTradeListApiSchema = z.array(BinanceTradeApiSchema);

export type BinanceTradeApiInterface = z.infer<typeof BinanceTradeApiSchema>;
