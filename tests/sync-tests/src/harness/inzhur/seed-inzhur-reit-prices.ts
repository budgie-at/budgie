import * as Effect from 'effect/Effect';

import { CONVERSION_AT, REIT } from './inzhur-operation-rows.constant';
import { seedInzhurFundInstrument } from './seed-inzhur-fund-instrument';
import { seedInzhurPrice } from './seed-inzhur-price';

const REIT_CODE = 'INZHUR:REIT';
const REIT_PRICE = 10;

export const seedInzhurReitPrices = Effect.gen(function* () {
    yield* seedInzhurFundInstrument(REIT_CODE, REIT);
    yield* seedInzhurPrice(REIT_CODE, CONVERSION_AT.slice(0, 10), REIT_PRICE);
    yield* seedInzhurPrice(REIT_CODE, '2026-01-10', REIT_PRICE);
});
