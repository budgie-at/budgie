import * as Effect from 'effect/Effect';

import { REIT_ISIN } from './inzhur-fund-isins.constant';
import { seedInzhurPrice } from './seed-inzhur-price';

export const REIT_PRICE = 10;

export const seedInzhurReitPrices = Effect.gen(function* () {
    yield* seedInzhurPrice(REIT_ISIN, '2026-01-10', REIT_PRICE);
    yield* seedInzhurPrice(REIT_ISIN, '2026-03-05', REIT_PRICE);
});
