 
import { EXCHANGE_RATE_API_URL } from '../constant/exchange-rate-api-url.constant';

import type { ExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';

export const fetchExchangeRatesFromApi = async (): Promise<ExchangeRateApiResponse | null> => {
    try {
        const response = await fetch(EXCHANGE_RATE_API_URL);

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as ExchangeRateApiResponse;

        return data;
    } catch {
        return null;
    }
};
