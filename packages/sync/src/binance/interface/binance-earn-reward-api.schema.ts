import { z } from 'zod';

const BinanceEarnRewardApiSchema = z.object({
    asset: z.string(),
    rewards: z.string(),
    time: z.number()
});

export const BinanceEarnRewardListApiSchema = z.object({
    rows: z.array(BinanceEarnRewardApiSchema)
});

export type BinanceEarnRewardApiInterface = z.infer<typeof BinanceEarnRewardApiSchema>;
