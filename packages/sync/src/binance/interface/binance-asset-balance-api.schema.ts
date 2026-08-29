import { z } from 'zod';

const BinanceAssetBalanceApiSchema = z.object({
    asset: z.string(),
    free: z.string(),
    locked: z.string(),
    freeze: z.string().optional(),
    withdrawing: z.string().optional(),
    ipoable: z.string().optional()
});

export const BinanceAssetBalanceListApiSchema = z.array(BinanceAssetBalanceApiSchema);

export type BinanceAssetBalanceApiInterface = z.infer<typeof BinanceAssetBalanceApiSchema>;
