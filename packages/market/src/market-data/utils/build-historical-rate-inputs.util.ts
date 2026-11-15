import type { HistoricalExchangeRateEntityInterface, InstrumentDailyMarketPriceCreateEntityInterface } from '@budgie/contracts';

export const buildHistoricalRateInputs = (
    prices: readonly Pick<InstrumentDailyMarketPriceCreateEntityInterface, 'instrumentId' | 'quoteInstrumentId' | 'priceDate' | 'price'>[]
): HistoricalExchangeRateEntityInterface[] =>
    prices.flatMap(price => [
        {
            sourceInstrumentId: price.instrumentId,
            targetInstrumentId: price.quoteInstrumentId,
            rateDate: price.priceDate,
            rate: price.price
        },
        {
            sourceInstrumentId: price.quoteInstrumentId,
            targetInstrumentId: price.instrumentId,
            rateDate: price.priceDate,
            rate: 1 / price.price
        }
    ]);
