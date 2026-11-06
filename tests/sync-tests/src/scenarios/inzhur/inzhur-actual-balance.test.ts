import {
    INVESTMENTS_CATEGORY_ID,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { InzhurNotSetUpError, InzhurSetupService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, asc, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, testDb } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { BASE_ROWS } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';

const URI = 'base.xlsx';

const layer = makeInzhurOperationsLayer({ [URI]: buildInzhurOperationsWorkbook(BASE_ROWS) });

const setActualBalance = (actualBalance: number) =>
    Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.setActualBalance(actualBalance));

const findStatementReminder = (now: Date) =>
    Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.findStatementReminder(now));

const prepare = Effect.gen(function* () {
    yield* importInzhurOperations(URI);

    return (yield* requireInzhurSetup()).cashAccount;
});

const fetchCorrections = Effect.map(fetchInzhurLedger(), ledger =>
    ledger.filter(({ externalId }) => !externalId?.startsWith('inzhur:op:'))
);

describe('inzhur/actual-balance', () => {
    it.effect('books a higher actual balance as estimated dividend income in the investments category', () =>
        Effect.gen(function* () {
            const cashAccount = yield* prepare;

            expect(yield* setActualBalance(450)).toBe(250);
            expect(yield* setActualBalance(450)).toBe(0);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(450 * PRECISION);
            expect(yield* fetchCorrections).toMatchObject([
                {
                    type: TransactionTypeEnum.INCOME,
                    title: 'Inzhur dividends (estimated)',
                    externalId: `inzhur:actual-balance:${cashAccount.id}:450`,
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

    it.effect('records a lower actual balance as a titled adjustment once', () =>
        Effect.gen(function* () {
            const cashAccount = yield* prepare;

            expect(yield* setActualBalance(100)).toBe(-100);
            expect(yield* setActualBalance(100)).toBe(0);

            const adjustments = yield* testDb
                .select({ title: TransactionEntityTable.title, amount: TransactionEntryEntityTable.amount })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(
                    and(
                        eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                        eq(TransactionEntryEntityTable.accountId, cashAccount.id)
                    )
                )
                .orderBy(asc(TransactionEntityTable.id));

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(100 * PRECISION);
            expect(adjustments).toEqual([{ title: 'Inzhur balance correction', amount: 100 * PRECISION }]);
            expect(yield* fetchCorrections).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('leaves the books untouched when the actual balance matches', () =>
        Effect.gen(function* () {
            const cashAccount = yield* prepare;

            expect(yield* setActualBalance(200)).toBe(0);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(200 * PRECISION);
            expect(yield* fetchCorrections).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('fails with a not-set-up error before Inzhur is created', () =>
        Effect.gen(function* () {
            expect(yield* setActualBalance(10).pipe(Effect.flip)).toBeInstanceOf(InzhurNotSetUpError);
        }).pipe(Effect.provide(layer))
    );
});

const prepareWithTopUp = Effect.gen(function* () {
    yield* prepare;

    const bankAccount = yield* seedInzhurBankAccount;

    yield* importInzhurBankFlow(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, new Date('2026-01-20T08:00:00.000Z'));
});

describe('inzhur/statement-reminder', () => {
    it.effect('stays quiet when nothing happened since the last export', () =>
        Effect.gen(function* () {
            yield* prepare;

            expect(yield* findStatementReminder(new Date('2026-12-15T09:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );

    it.effect('stays quiet while the export is under a month old even after a top-up', () =>
        Effect.gen(function* () {
            yield* prepareWithTopUp;

            expect(yield* findStatementReminder(new Date('2026-02-05T09:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );

    it.effect('reminds once the export is stale and a top-up happened after it', () =>
        Effect.gen(function* () {
            yield* prepareWithTopUp;

            expect(yield* findStatementReminder(new Date('2026-12-15T09:00:00.000Z'))).toEqual({
                daysOld: 339,
                lastStatementDate: '2026-01-10'
            });
        }).pipe(Effect.provide(layer))
    );
});
