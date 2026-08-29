import { z } from 'zod';

const BinanceEarnPositionApiSchema = z.object({
    asset: z.string(),
    totalAmount: z.string()
});

export const BinanceEarnPositionListApiSchema = z.object({
    rows: z.array(BinanceEarnPositionApiSchema),
    total: z.number()
});

export type BinanceEarnPositionApiInterface = z.infer<typeof BinanceEarnPositionApiSchema>;
