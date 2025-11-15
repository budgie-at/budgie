export interface ExchangeRateApiResponseInterface {
    base: string;
    date: string;
    rates: Record<string, number>;
}
