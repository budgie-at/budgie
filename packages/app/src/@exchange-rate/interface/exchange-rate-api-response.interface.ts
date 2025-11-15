export interface ExchangeRateApiResponse {
    base: string;
    date: string;
    rates: Record<string, number>;
}
