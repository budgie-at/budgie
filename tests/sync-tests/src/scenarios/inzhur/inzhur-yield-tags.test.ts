import { YieldKindEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildInzhurOperationsWorkbook,
    fetchBankTransactions,
    fetchInzhurOperationsLedger,
    importInzhurBankFlow,
    importInzhurOperations
} from '../../harness';
import { REIT_DIVIDEND_DESCRIPTION, UNNAMED_DIVIDEND_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { BASE_ROWS, FULL_HISTORY_ROWS, OCEAN } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const HISTORY_URI = 'history.xlsx';
const BASE_URI = 'base.xlsx';
const OPERATED_AT = new Date('2026-06-01T08:00:00.000Z');

const layer = makeInzhurOperationsLayer({
    [HISTORY_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
    [BASE_URI]: buildInzhurOperationsWorkbook(BASE_ROWS)
});

describe('inzhur/yield-tags', () => {
    it.effect('tags imported dividends as DIVIDEND and dividend tax as TAX, both sourced from the fund', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(HISTORY_URI);

            const ocean = yield* requireInzhurFundByName(OCEAN);
            const ledger = yield* fetchInzhurOperationsLedger;
            const titled = (title: string) => ledger.find(transaction => transaction.title === title);

            expect(titled('Ocean dividends')).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: ocean.id });
            expect(titled('Ocean dividend tax')).toMatchObject({ yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: ocean.id });
            expect(ledger.filter(transaction => transaction.title.startsWith('Bought')).every(({ yieldKind }) => yieldKind === null)).toBe(
                true
            );
        }).pipe(Effect.provide(layer))
    );

    it.effect('tags an attributed bank dividend with its fund and an unattributed one with no source', () =>
        Effect.gen(function* () {
            yield* importInzhurOperations(BASE_URI);

            const bankAccount = yield* seedInzhurBankAccount;
            const reit = yield* requireInzhurFundAccount(REIT_ISIN);

            yield* importInzhurBankFlow(bankAccount.id, 'dividend-reit', REIT_DIVIDEND_DESCRIPTION, 120, OPERATED_AT);
            yield* importInzhurBankFlow(bankAccount.id, 'dividend-unnamed', UNNAMED_DIVIDEND_DESCRIPTION, 80, OPERATED_AT);

            const transactions = yield* fetchBankTransactions;

            expect(transactions.find(({ externalId }) => externalId === 'dividend-reit')).toMatchObject({
                yieldKind: YieldKindEnum.DIVIDEND,
                yieldSourceAccountId: reit.id
            });
            expect(transactions.find(({ externalId }) => externalId === 'dividend-unnamed')).toMatchObject({
                yieldKind: YieldKindEnum.DIVIDEND,
                yieldSourceAccountId: null
            });
        }).pipe(Effect.provide(layer))
    );
});
