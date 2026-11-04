import { CurrencyEnum, InstrumentDailyMarketPriceEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/setup';

import { requireInstrumentByCode } from './require-instrument-by-code';

export const seedInzhurPrice = Effect.fnUntraced(function* (isin: string, priceDate: string, price: number) {
    const fund = yield* requireInstrumentByCode(isin);
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

    yield* testDb
        .insert(InstrumentDailyMarketPriceEntityTable)
        .values({ instrumentId: fund.id, quoteInstrumentId: hryvnia.id, priceDate, price, source: 'INZHUR' });
});
