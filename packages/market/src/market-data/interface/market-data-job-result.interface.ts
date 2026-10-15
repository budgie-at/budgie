import type { HistoricalExchangeRateCreateEntityInterface, InstrumentDailyMarketPriceCreateEntityInterface } from '@budgie/contracts';

export interface MarketDataJobResultInterface {
    readonly prices: InstrumentDailyMarketPriceCreateEntityInterface[];
    readonly rates: HistoricalExchangeRateCreateEntityInterface[];
    readonly unsupportedCurrencyCodes: string[];
}
