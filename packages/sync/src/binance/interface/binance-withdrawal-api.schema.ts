import { z } from 'zod';

const BinanceWithdrawalApiSchema = z.object({
    id: z.string(),
    txId: z.string().optional(),
    amount: z.string(),
    transactionFee: z.string(),
    coin: z.string(),
    applyTime: z.string()
});

export const BinanceWithdrawalListApiSchema = z.array(BinanceWithdrawalApiSchema);

export type BinanceWithdrawalApiInterface = z.infer<typeof BinanceWithdrawalApiSchema>;
