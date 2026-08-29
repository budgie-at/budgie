import { z } from 'zod';

export const BinanceCredentialsSchema = z.object({
    apiKey: z.string().min(1),
    apiSecret: z.string().min(1)
});

export type BinanceCredentialsInterface = z.infer<typeof BinanceCredentialsSchema>;
