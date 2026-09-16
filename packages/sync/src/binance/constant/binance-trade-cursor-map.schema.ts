import { z } from 'zod';

export const BinanceTradeCursorMapSchema = z.record(z.string(), z.number());

export type BinanceTradeCursorMapInterface = z.infer<typeof BinanceTradeCursorMapSchema>;
