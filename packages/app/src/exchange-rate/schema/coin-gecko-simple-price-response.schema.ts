import { number, record, string } from 'zod';

export const CoinGeckoSimplePriceResponseSchema = record(string(), record(string(), number()));
