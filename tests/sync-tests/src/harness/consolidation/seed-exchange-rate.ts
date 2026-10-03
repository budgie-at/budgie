import { ExchangeRateCreateEntityInterface, ExchangeRateEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const seedExchangeRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number) =>
    Effect.gen(function* () {
        yield* testDb
            .insert(ExchangeRateEntityTable)
            .values({ source: 'test', baseInstrumentId, quoteInstrumentId, rate } satisfies ExchangeRateCreateEntityInterface);
    });
