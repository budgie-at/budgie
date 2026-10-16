import type {
    HistoricalExchangeRateCreateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface
} from '@budgie/contracts';

export interface MarketDataJobResultInterface {
    readonly prices: InstrumentDailyMarketPriceCreateEntityInterface[];
    readonly rates: HistoricalExchangeRateCreateEntityInterface[];
    readonly unsupportedInstruments: Pick<InstrumentEntityInterface, 'code' | 'id'>[];
}
