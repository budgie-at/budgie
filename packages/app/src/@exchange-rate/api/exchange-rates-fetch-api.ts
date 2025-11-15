 
import { EXCHANGE_RATE_API_URL } from '../constant/exchange-rate-api-url.constant';

import type { ExchangeRateApiResponseInterface } from '../interface/exchange-rate-api-response.interface';

export const exchangeRatesFetchApi = async (): Promise<ExchangeRateApiResponseInterface | null> => {
    try {
        const response = await fetch(EXCHANGE_RATE_API_URL);

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as ExchangeRateApiResponseInterface;

        return data;
    } catch {
        return null;
    }
};
