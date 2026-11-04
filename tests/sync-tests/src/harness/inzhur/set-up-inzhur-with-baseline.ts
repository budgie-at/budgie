import { PRECISION } from '@budgie/contracts';
import { InzhurImportOutcomeEnum, InzhurSetupService } from '@budgie/sync';
import { expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../db/fetch-account-balance';

import { importInzhurStatement } from './import-inzhur-statement';
import { INZHUR_ENERGY_LAYOUT, INZHUR_REIT_LAYOUT } from './inzhur-fund-layouts';
import { ENERGY_PRICE, FIRST_URI, REIT_PRICE, SECOND_DATE_ISO } from './inzhur-statement-fixtures.constant';
import { requireInzhurFundAccount } from './require-inzhur-fund-account';
import { seedInzhurPrice } from './seed-inzhur-price';

export const setUpInzhurWithBaseline = Effect.fnUntraced(function* (openingCash: number, baselineReit: number, baselineEnergy: number) {
    const inzhurSetupService = yield* InzhurSetupService;
    const { cashAccount } = yield* inzhurSetupService.setup(openingCash);
    const baseline = yield* importInzhurStatement(FIRST_URI);
    const reitAccount = yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin);
    const energyAccount = yield* requireInzhurFundAccount(INZHUR_ENERGY_LAYOUT.isin);

    expect(baseline.outcome).toBe(InzhurImportOutcomeEnum.BASELINE);
    expect(yield* fetchAccountBalance(reitAccount.id)).toBe(baselineReit * PRECISION);
    expect(yield* fetchAccountBalance(energyAccount.id)).toBe(baselineEnergy * PRECISION);
    yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, SECOND_DATE_ISO, REIT_PRICE);
    yield* seedInzhurPrice(INZHUR_ENERGY_LAYOUT.isin, SECOND_DATE_ISO, ENERGY_PRICE);

    return { cashAccount, reitAccount, energyAccount };
});
