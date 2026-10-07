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

import type { TransactionEntryEntityInterface } from '@budgie/contracts';

const EUR_NUMERIC_CODE = 978;

const syncEuroExpense = (externalId: string) =>
    Effect.gen(function* () {
        const monobankSyncService = yield* MonobankSyncService;
        yield* setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({
                id: externalId,
                amount: -4_500_000,
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

            const editedEntry = yield* editPrimaryEntry(transaction.id, primaryEntry, 45_000);

            expect(editedEntry?.operationInstrumentId).toBe(euro.id);
            expect(editedEntry?.operationAmount).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('clears operation metadata when the user changes the entry amount', () =>
        Effect.gen(function* () {
            const { transaction, primaryEntry } = yield* syncEuroExpense('tx-edit-amount');

            const editedEntry = yield* editPrimaryEntry(transaction.id, primaryEntry, 40_000);

            expect(editedEntry?.amount).toBe(40_000 * PRECISION);
            expect(editedEntry?.operationInstrumentId).toBeNull();
            expect(editedEntry?.operationAmount).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
