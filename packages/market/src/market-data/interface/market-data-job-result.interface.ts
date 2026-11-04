import type {
    HistoricalExchangeRateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface
} from '@budgie/contracts';

export interface MarketDataJobResultInterface {
    readonly prices: InstrumentDailyMarketPriceCreateEntityInterface[];
    readonly rates: HistoricalExchangeRateEntityInterface[];
    readonly unsupportedInstruments: Pick<InstrumentEntityInterface, 'code' | 'id'>[];
}
