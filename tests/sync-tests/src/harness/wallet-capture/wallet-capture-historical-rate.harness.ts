import { HistoricalExchangeRateRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';

export const walletCaptureSeedHistoricalRate = Effect.fnUntraced(function* (
    sourceInstrumentId: number,
    targetInstrumentId: number,
    rate: number,
    rateDate: string
) {
    const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;

    yield* historicalExchangeRateRepository.bulkUpsert([{ sourceInstrumentId, targetInstrumentId, rate, rateDate }]);
});
