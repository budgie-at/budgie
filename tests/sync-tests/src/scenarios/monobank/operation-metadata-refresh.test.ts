import {
    CurrencyEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, RefreshedImportedEntriesService, TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchExpenseEntries, requireInstrument, seed, testDb, TestLayer } from '../../harness';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const FUNDING_AMOUNT = 45_000;
const OPERATION_AMOUNT = 1000 * PRECISION;
const UNMATCHED_ACCOUNT_ID = 999;
const PARTIAL_OPERATION_AMOUNT = 2000 * PRECISION;

const refreshCases = [
    { name: 'legacy omitted', changes: {}, preservesPair: true },
    { name: 'explicit unavailable', changes: { operationInstrumentId: null, operationAmount: null }, preservesPair: false },
    { name: 'partial instrument', changes: { operationInstrumentId: 1 }, preservesPair: false },
    { name: 'partial amount', changes: { operationAmount: PARTIAL_OPERATION_AMOUNT }, preservesPair: false },
    { name: 'partial null instrument', changes: { operationInstrumentId: null }, preservesPair: false },
    { name: 'changed account', changes: { accountId: UNMATCHED_ACCOUNT_ID }, preservesPair: false },
    { name: 'changed amount', changes: { amount: FUNDING_AMOUNT - 1 }, preservesPair: false },
    { name: 'changed type', changes: { type: TransactionEntryTypeEnum.DEBIT }, preservesPair: false },
    { name: 'changed kind', changes: { kind: TransactionEntryKindEnum.DEBT_SETTLEMENT }, preservesPair: false }
];

describe('monobank/operation-metadata-refresh', () => {
    it.effect.each(refreshCases)('handles $name without combining incoming and stored operation fields', ({ changes, preservesPair }) =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const refreshedImportedEntriesService = yield* RefreshedImportedEntriesService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const account = yield* seed.account({ title: 'Source' });
            const transaction = yield* seed.bankPairExpense(
                { externalId: 'metadata-refresh', operatedAt: new Date('2026-06-02T12:00:00.000Z') },
                { accountId: account.id, amount: FUNDING_AMOUNT * PRECISION }
            );
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ operationInstrumentId: euro.id, operationAmount: OPERATION_AMOUNT })
                .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
            const existingEntries = yield* fetchExpenseEntries(transaction.id);
            const [existingEntry] = existingEntries;
            const input: TransactionCreateInputInterface = {
                ...transaction,
                amount: FUNDING_AMOUNT,
                tagIds: [],
                entries: [
                    {
                        accountId: account.id,
                        amount: FUNDING_AMOUNT,
                        type: existingEntry.type,
                        kind: existingEntry.kind,
                        externalId: existingEntry.externalId,
                        categoryId: existingEntry.categoryId,
                        mccCategoryId: existingEntry.mccCategoryId,
                        exchangeRate: existingEntry.exchangeRate,
                        toIban: existingEntry.toIban,
                        ...changes
                    }
                ]
            };
            const refreshed = yield* refreshedImportedEntriesService.build({
                transactionId: transaction.id,
                input,
                inputEntries: input.entries,
                existingEntries
            });

            expect(refreshed.entries?.[0]).toMatchObject({
                amount: existingEntry.amount,
                operationInstrumentId: preservesPair ? euro.id : null,
                operationAmount: preservesPair ? OPERATION_AMOUNT : null
            });

            yield* transactionService.bulkUpdateImported([input]);
            yield* accountBalanceIncrementalService.updateAllBalances(true);

            const [updated] = yield* fetchExpenseEntries(transaction.id);

            expect(updated).toMatchObject({
                operationInstrumentId: preservesPair || Object.hasOwn(changes, 'accountId') ? euro.id : null,
                operationAmount: preservesPair || Object.hasOwn(changes, 'accountId') ? OPERATION_AMOUNT : null
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
