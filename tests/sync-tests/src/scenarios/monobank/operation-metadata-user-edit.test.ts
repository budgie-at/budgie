import { buildExpenseEntry } from '@app/transaction/utils/build-expense-entry.util';
import { CurrencyEnum, PRECISION, TransactionEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    buildMonobank,
    fetchExpenseEntries,
    monobankStub,
    MonobankSyncService,
    requireInstrument,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';
import { seed } from '../../harness/seed/seed';

import type { TransactionEntryEntityInterface } from '@budgie/contracts';

const EUR_NUMERIC_CODE = 978;
const FUNDING_AMOUNT = 45_000;
const EDITED_FUNDING_AMOUNT = 40_000;

const syncEuroExpense = (externalId: string) =>
    Effect.gen(function* () {
        const monobankSyncService = yield* MonobankSyncService;
        yield* setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({
                id: externalId,
                amount: -FUNDING_AMOUNT * 100,
                operationAmount: -100_000,
                currencyCode: EUR_NUMERIC_CODE,
                hold: false
            })
        ]);

        yield* monobankSyncService.sync();

        const [transaction] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, externalId));
        const primaryEntry = (yield* fetchExpenseEntries(transaction.id)).find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);

        if (!isDefined(primaryEntry)) {
            return yield* Effect.die(new Error(`Primary entry for ${externalId} not found`));
        }

        return { transaction, primaryEntry };
    });

const editPrimaryEntry = (transactionId: number, primaryEntry: TransactionEntryEntityInterface, amount: number) =>
    Effect.gen(function* () {
        const transactionService = yield* TransactionService;

        yield* transactionService.updateById(transactionId, {
            title: 'Edited',
            tagIds: [],
            entries: [
                {
                    accountId: primaryEntry.accountId,
                    categoryId: primaryEntry.categoryId,
                    mccCategoryId: primaryEntry.mccCategoryId,
                    type: primaryEntry.type,
                    kind: primaryEntry.kind,
                    amount,
                    externalId: primaryEntry.externalId,
                    exchangeRate: primaryEntry.exchangeRate,
                    operationInstrumentId: primaryEntry.operationInstrumentId,
                    operationAmount: primaryEntry.operationAmount
                }
            ]
        });

        return (yield* fetchExpenseEntries(transactionId)).find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
    });

describe('monobank/operation-metadata-user-edit', () => {
    it.effect('keeps operation metadata when the user edit leaves the amount and account unchanged', () =>
        Effect.gen(function* () {
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const { transaction, primaryEntry } = yield* syncEuroExpense('tx-edit-same');

            const editedEntry = yield* editPrimaryEntry(transaction.id, primaryEntry, FUNDING_AMOUNT);

            expect(editedEntry?.operationInstrumentId).toBe(euro.id);
            expect(editedEntry?.operationAmount).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps operation metadata after a comment-only quick-form edit', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const { transaction, primaryEntry } = yield* syncEuroExpense('tx-quick-comment');
            const category = yield* seed.category('Deposit funding');

            yield* transactionService.updateById(transaction.id, {
                comment: 'Edited note',
                tagIds: [],
                entries: buildExpenseEntry({
                    accountId: primaryEntry.accountId,
                    categoryId: category.id,
                    mccCategoryId: primaryEntry.mccCategoryId,
                    amount: FUNDING_AMOUNT
                })
            });

            const [editedEntry] = yield* fetchExpenseEntries(transaction.id);

            expect(editedEntry.operationInstrumentId).toBe(euro.id);
            expect(editedEntry.operationAmount).toBe(1000 * PRECISION);
            expect(editedEntry.amount).toBe(primaryEntry.amount);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('clears operation metadata when the quick-form edit changes the funding account', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const { transaction, primaryEntry } = yield* syncEuroExpense('tx-edit-account');
            const category = yield* seed.category('Deposit funding');
            const otherAccount = yield* seed.account({ title: 'Other funding account' });

            yield* transactionService.updateById(transaction.id, {
                fromAccountId: otherAccount.id,
                tagIds: [],
                entries: buildExpenseEntry({
                    accountId: otherAccount.id,
                    categoryId: category.id,
                    mccCategoryId: primaryEntry.mccCategoryId,
                    amount: FUNDING_AMOUNT
                })
            });

            const [editedEntry] = yield* fetchExpenseEntries(transaction.id);

            expect(editedEntry.accountId).toBe(otherAccount.id);
            expect(editedEntry.operationInstrumentId).toBeNull();
            expect(editedEntry.operationAmount).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('clears operation metadata when the user changes the entry amount', () =>
        Effect.gen(function* () {
            const { transaction, primaryEntry } = yield* syncEuroExpense('tx-edit-amount');

            const editedEntry = yield* editPrimaryEntry(transaction.id, primaryEntry, EDITED_FUNDING_AMOUNT);

            expect(editedEntry?.amount).toBe(EDITED_FUNDING_AMOUNT * PRECISION);
            expect(editedEntry?.operationInstrumentId).toBeNull();
            expect(editedEntry?.operationAmount).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
