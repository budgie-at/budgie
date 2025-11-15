export interface ExchangeRateApiResponseInterface {
    base: string;
    date: string;
    rates: Record<string, number>;
}

export const emptyExchangeRateApiResponse = {
    base: '',
    date: '',
    rates: {
        USD: 1
    }
} satisfies ExchangeRateApiResponseInterface;
