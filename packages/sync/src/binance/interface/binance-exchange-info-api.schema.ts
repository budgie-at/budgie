import { z } from 'zod';

const BinanceExchangeInfoSymbolApiSchema = z.object({
    symbol: z.string(),
    status: z.string()
});

export const BinanceExchangeInfoApiSchema = z.object({
    symbols: z.array(BinanceExchangeInfoSymbolApiSchema)
});
