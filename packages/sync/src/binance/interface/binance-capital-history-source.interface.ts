import type { z } from 'zod';

export interface BinanceCapitalHistorySourceInterface<T> {
    readonly endpoint: string;
    readonly schema: z.ZodType<T[]>;
    readonly cache: Map<string, T[]>;
}
