import { CurrencyEnum, InstrumentPriceProviderEnum, InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/test-db';

export const seedInzhurPrice = Effect.fnUntraced(function* (isin: string, priceDate: string, price: number) {
    const fund = yield* requireInstrument(isin);
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

    yield* testDb
        .insert(InstrumentDailyMarketPriceEntityTable)
        .values({ instrumentId: fund.id, quoteInstrumentId: hryvnia.id, priceDate, price, source: InstrumentPriceProviderEnum.INZHUR });
});
