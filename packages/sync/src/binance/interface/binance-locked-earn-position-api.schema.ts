import { z } from 'zod';

const BinanceLockedEarnPositionApiSchema = z.object({
    asset: z.string(),
    amount: z.string()
});

export const BinanceLockedEarnPositionListApiSchema = z.object({
    rows: z.array(BinanceLockedEarnPositionApiSchema),
    total: z.number()
});

export type BinanceLockedEarnPositionApiInterface = z.infer<typeof BinanceLockedEarnPositionApiSchema>;
