import { number, object, record, string } from 'zod';

export const ExchangeRateApiResponseSchema = object({
    base: string(),
    date: string(),
    rates: record(string(), number())
});
