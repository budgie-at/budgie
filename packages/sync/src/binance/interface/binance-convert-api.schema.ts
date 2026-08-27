import { z } from 'zod';

const BinanceConvertFlowApiSchema = z.object({
    quoteId: z.string(),
    orderId: z.number(),
    orderStatus: z.string(),
    fromAsset: z.string(),
    fromAmount: z.string(),
    toAsset: z.string(),
    toAmount: z.string(),
    createTime: z.number()
});

export const BinanceConvertTradeFlowApiSchema = z.object({
    list: z.array(BinanceConvertFlowApiSchema),
    startTime: z.number(),
    endTime: z.number(),
    limit: z.number(),
    moreData: z.boolean()
});

export type BinanceConvertFlowApiInterface = z.infer<typeof BinanceConvertFlowApiSchema>;
