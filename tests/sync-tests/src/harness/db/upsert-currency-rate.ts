import { ExchangeRateRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';

import { requireInstrument } from './require-instrument';

import type { CurrencyEnum } from '@budgie/contracts';

export const upsertCurrencyRate = Effect.fnUntraced(function* (baseCurrency: CurrencyEnum, quoteCurrency: CurrencyEnum, rate: number) {
    const exchangeRateRepository = yield* ExchangeRateRepository;
    const baseInstrument = yield* requireInstrument(baseCurrency);
    const quoteInstrument = yield* requireInstrument(quoteCurrency);

    yield* exchangeRateRepository.upsert(baseInstrument.id, quoteInstrument.id, rate, 'test');

    return { baseInstrument, quoteInstrument };
});
