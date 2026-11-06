import { PRECISION, TransactionEntryTypeEnum } from '@budgie/contracts';
import { InzhurPriceMissingError, InzhurSetupService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchInzhurOperationsLedger } from '../../harness/inzhur/fetch-inzhur-operations-ledger';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { inzhurHomeClientLayer } from '../../harness/inzhur/inzhur-home-client.layer';
import { CASH_AFTER_HISTORY, FULL_HISTORY_ROWS, REIT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const FULL_URI = 'full.xlsx';
const OLDER_TOP_UP_URI = 'older-top-up.xlsx';
const NO_SURCHARGE_URI = 'no-surcharge.xlsx';
const SECOND_TOP_UP_URI = 'second-top-up.xlsx';

const bytesByUri = {
    [FULL_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
    [NO_SURCHARGE_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.filter(row => row.type !== 'Доплата')),
    [OLDER_TOP_UP_URI]: buildInzhurOperationsWorkbook([{ at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: 1000 }]),
    [SECOND_TOP_UP_URI]: buildInzhurOperationsWorkbook([{ at: '2026-01-11T10:00:00', type: TOP_UP_TYPE, debit: 1000 }])
};
const layer = makeInzhurOperationsLayer(bytesByUri);

describe('inzhur/operations-review', () => {
    it.effect('estimates a first-import conversion from the live Inzhur price when nothing is cached', () =>
        Effect.gen(function* () {
            const summary = yield* importInzhurOperations(FULL_URI);
            const reit = yield* requireInzhurFundByName(REIT);

            expect(summary.funds.find(fund => fund.name === REIT)).toMatchObject({ isConvertedInEstimated: true });
            expect(yield* fetchAccountBalance(reit.id)).toBe(480 * PRECISION);
        }).pipe(Effect.provide(Layer.merge(layer, inzhurHomeClientLayer({ [REIT]: 10 }))))
    );

    it.effect('rolls back the setup with a typed error when no price can be found at all', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;

            expect(yield* Effect.flip(importInzhurOperations(FULL_URI))).toBeInstanceOf(InzhurPriceMissingError);
            expect(yield* inzhurSetupService.findSetup()).toBeNull();
        }).pipe(Effect.provide(Layer.merge(layer, inzhurHomeClientLayer({}))))
    );

    it.effect('does not let a later export re-match a bank transfer an earlier export already claimed', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurOperations(OLDER_TOP_UP_URI);
            yield* importInzhurBankFlow(bankAccount.id, 'bank-top-up', TOP_UP_DESCRIPTION, -1000, new Date('2026-01-10T08:00:00.000Z'));

            const summary = yield* importInzhurOperations(SECOND_TOP_UP_URI);
            const { cashAccount } = yield* requireInzhurSetup();

            expect(summary.bankMatches).toEqual({ paired: 0, unpaired: 1 });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(2000 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('updates an imported conversion when its surcharge arrives in a later export', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(NO_SURCHARGE_URI);

            const { cashAccount } = yield* requireInzhurSetup();

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe((CASH_AFTER_HISTORY + 10) * PRECISION);

            yield* importInzhurOperations(FULL_URI);

            const conversionBuy = (yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Bought REIT').at(-1);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            expect(conversionBuy?.entries[0]).toMatchObject({ type: TransactionEntryTypeEnum.CREDIT, amount: 4300 * PRECISION });
        }).pipe(Effect.provide(layer))
    );
});
