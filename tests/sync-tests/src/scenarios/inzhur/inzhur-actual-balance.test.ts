import {
    AccountTypeEnum,
    ExternalSourceEnum,
    INVESTMENTS_CATEGORY_ID,
    PRECISION,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { InzhurNotSetUpError, InzhurSetupService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, seed } from '../../harness';
import { buildInzhurBaselineItems } from '../../harness/inzhur/build-inzhur-baseline-items';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { FIRST_URI } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from '../../harness/inzhur/make-inzhur-layer';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const UAH_INSTRUMENT_ID = 1;
const TOP_UP_DESCRIPTION = 'Оплата ТОВ "ІНЖУР КЕПІТАЛ" поповнення рахунку';
const TOP_UP_AT = new Date('2026-10-15T12:00:00.000Z');
const ESTIMATED_DIVIDEND_TITLE = 'Inzhur dividends (estimated)';

const layer = makeInzhurLayer({ [FIRST_URI]: buildInzhurBaselineItems(1000, 2) });

const setActualBalance = (actualBalance: number) =>
    Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.setActualBalance(actualBalance));

const findStatementReminder = (now: Date) =>
    Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.findStatementReminder(now));

const seedTopUp = Effect.gen(function* () {
    const bankAccount = yield* seed.account({
        title: 'Monobank Card',
        externalId: 'inzhur-actual-balance-card',
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: UAH_INSTRUMENT_ID
    });

    yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, TOP_UP_AT);
    yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));
});

describe('inzhur/actual-balance', () => {
    it.effect('books a higher actual balance as estimated dividend income in the investments category', () =>
        Effect.gen(function* () {
            const { cashAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

            expect(yield* setActualBalance(1250)).toBe(250);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1250 * PRECISION);
            expect(yield* fetchInzhurLedger()).toMatchObject([
                {
                    type: TransactionTypeEnum.INCOME,
                    title: ESTIMATED_DIVIDEND_TITLE,
                    entries: [
                        {
                            accountId: cashAccount.id,
                            type: TransactionEntryTypeEnum.DEBIT,
                            amount: 250 * PRECISION,
                            categoryId: INVESTMENTS_CATEGORY_ID
                        }
                    ]
                }
            ]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('records a lower actual balance as a plain adjustment', () =>
        Effect.gen(function* () {
            const { cashAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

            expect(yield* setActualBalance(900)).toBe(-100);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(900 * PRECISION);
            expect(yield* fetchInzhurLedger()).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('leaves the books untouched when the actual balance matches', () =>
        Effect.gen(function* () {
            const { cashAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

            expect(yield* setActualBalance(1000)).toBe(0);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
            expect(yield* fetchInzhurLedger()).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('fails with a not-set-up error before Inzhur is created', () =>
        Effect.gen(function* () {
            const error = yield* setActualBalance(10).pipe(Effect.flip);

            expect(error).toBeInstanceOf(InzhurNotSetUpError);
        }).pipe(Effect.provide(layer))
    );
});

describe('inzhur/statement-reminder', () => {
    it.effect('stays quiet when nothing happened since the last statement', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(0, 1000, 2);

            expect(yield* findStatementReminder(new Date('2026-12-15T09:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );

    it.effect('stays quiet while the statement is under a month old even after a top-up', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(0, 1000, 2);
            yield* seedTopUp;

            expect(yield* findStatementReminder(new Date('2026-10-20T09:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );

    it.effect('reminds once the statement is stale and a top-up happened after it', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(0, 1000, 2);
            yield* seedTopUp;

            expect(yield* findStatementReminder(new Date('2026-12-15T09:00:00.000Z'))).toEqual({
                daysOld: 76,
                lastStatementDate: '2026-09-30'
            });
        }).pipe(Effect.provide(layer))
    );
});
