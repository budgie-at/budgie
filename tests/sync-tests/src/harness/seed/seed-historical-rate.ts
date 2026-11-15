import { HistoricalExchangeRateRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';

export const seedHistoricalRate = Effect.fnUntraced(function* (
    sourceInstrumentId: number,
    targetInstrumentId: number,
    rateDate: string,
    rate: number
) {
    const repository = yield* HistoricalExchangeRateRepository;

    yield* repository.bulkUpsert([{ sourceInstrumentId, targetInstrumentId, rateDate, rate }]);
});
