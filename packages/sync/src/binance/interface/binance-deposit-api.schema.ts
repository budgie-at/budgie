import { z } from 'zod';

const BinanceDepositApiSchema = z.object({
    id: z.string().optional(),
    txId: z.string().optional(),
    amount: z.string(),
    coin: z.string(),
    insertTime: z.number()
});

export const BinanceDepositListApiSchema = z.array(BinanceDepositApiSchema);

export type BinanceDepositApiInterface = z.infer<typeof BinanceDepositApiSchema>;
