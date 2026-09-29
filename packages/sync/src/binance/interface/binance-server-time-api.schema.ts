import { z } from 'zod';

export const BinanceServerTimeApiSchema = z.object({
    serverTime: z.number()
});
