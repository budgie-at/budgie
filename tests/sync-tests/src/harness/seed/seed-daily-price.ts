import { HistoricalExchangeRateRepository, InstrumentDailyMarketPriceRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';

export const seedDailyPrice = Effect.fnUntraced(function* (
    instrumentId: number,
    quoteInstrumentId: number,
    priceDate: string,
    price: number
) {
    const dailyPriceRepository = yield* InstrumentDailyMarketPriceRepository;
    const historicalRepository = yield* HistoricalExchangeRateRepository;

    yield* dailyPriceRepository.bulkUpsert([
        { instrumentId, quoteInstrumentId, priceDate, price, marketCap: null, volume: null, source: 'test' }
    ]);
    yield* historicalRepository.bulkUpsert([
        { sourceInstrumentId: instrumentId, targetInstrumentId: quoteInstrumentId, rateDate: priceDate, rate: price },
        { sourceInstrumentId: quoteInstrumentId, targetInstrumentId: instrumentId, rateDate: priceDate, rate: 1 / price }
    ]);
});
