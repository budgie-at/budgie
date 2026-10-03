import * as Contracts from '@budgie/contracts';
import { TransactionImportService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { fetchCachedBalanceAmount, seed, seedLedgerBalance, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { ImportedBatchPreparationInterface } from '@budgie/ledger';

const OPERATED_AT_YEAR = 2026;
const DEPOSIT_EXPENSE_ERROR = 'Deposit accounts cannot fund expenses';
const OPERATED_AT = new Date(OPERATED_AT_YEAR, 0, 15, 12, 0, 0);
const IMPORT_EXTERNAL_ID = 'deposit-file-import-expense';
const IMPORT_UPDATED_AMOUNT = 40;
const IMPORT_INITIAL_AMOUNT = 20 * Contracts.PRECISION;

const buildImportInput = (accountId: number, amount = IMPORT_UPDATED_AMOUNT): Contracts.TransactionCreateInputInterface => ({
    amount,
    title: 'Deposit file import expense',
    comment: 'updated',
    type: Contracts.TransactionTypeEnum.EXPENSE,
    exchangeRate: 1,
    operatedAt: OPERATED_AT,
    externalId: IMPORT_EXTERNAL_ID,
    externalSource: Contracts.ExternalSourceEnum.ERSTE,
    updatedBy: null,
    fromAccountId: accountId,
    toAccountId: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: Contracts.TransactionEntryTypeEnum.CREDIT,
            kind: Contracts.TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null,
            externalId: IMPORT_EXTERNAL_ID,
            exchangeRate: 1,
            toIban: null
        }
    ]
});

const buildPrepared = (input: Contracts.TransactionCreateInputInterface, existingTransactionIdMap = new Map<string, number>()) => ({
    externalIdMap: existingTransactionIdMap,
    transactionInputs: [input]
});

const seedImportedExpense = (accountId: number) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(Contracts.TransactionEntityTable, {
            type: Contracts.TransactionTypeEnum.EXPENSE,
            title: 'Original imported deposit expense',
            externalId: IMPORT_EXTERNAL_ID,
            comment: 'original',
            operatedAt: OPERATED_AT,
            fromAccountId: accountId,
            toAccountId: null,
            exchangeRate: 1,
            externalSource: Contracts.ExternalSourceEnum.ERSTE,
            updatedBy: null,
            needsEmbedding: false
        });

        yield* insertOne(Contracts.TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: Contracts.TransactionEntryTypeEnum.CREDIT,
            kind: Contracts.TransactionEntryKindEnum.PRIMARY,
            amount: IMPORT_INITIAL_AMOUNT,
            categoryId: null,
            mccCategoryId: null,
            externalId: IMPORT_EXTERNAL_ID,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null,
            originalTransactionId: null
        });

        return transaction.id;
    });

const expectDepositExpenseRejected = Effect.fnUntraced(function* (prepared: ImportedBatchPreparationInterface) {
    const transactionImportService = yield* TransactionImportService;
    const cause = yield* Effect.flip(Effect.sandbox(transactionImportService.bulkUpsertPreparedImported(prepared)));

    expect(String(Cause.squash(cause))).toContain(DEPOSIT_EXPENSE_ERROR);
});

describe('import/deposit-import-safety', () => {
    it.effect('rejects new prepared imported deposit expenses without changing rows or balances', () =>
        Effect.gen(function* () {
            const depositAccount = yield* seed.account({ type: Contracts.AccountTypeEnum.DEPOSIT });
            const prepared = buildPrepared(buildImportInput(depositAccount.id));

            yield* seedLedgerBalance(depositAccount.id, 100 * Contracts.PRECISION);

            yield* expectDepositExpenseRejected(prepared);

            expect(yield* testDb.select().from(Contracts.TransactionEntityTable)).toHaveLength(1);
            expect(yield* testDb.select().from(Contracts.TransactionEntryEntityTable)).toHaveLength(1);
            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * Contracts.PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects prepared imported refreshes for existing deposit expenses and preserves rows', () =>
        Effect.gen(function* () {
            const depositAccount = yield* seed.account({ type: Contracts.AccountTypeEnum.DEPOSIT });
            const transactionId = yield* seedImportedExpense(depositAccount.id);
            const prepared: ImportedBatchPreparationInterface = buildPrepared(
                buildImportInput(depositAccount.id),
                new Map([[IMPORT_EXTERNAL_ID, transactionId]])
            );

            yield* seedLedgerBalance(depositAccount.id, 100 * Contracts.PRECISION);

            yield* expectDepositExpenseRejected(prepared);

            const [transaction] = yield* testDb
                .select()
                .from(Contracts.TransactionEntityTable)
                .where(eq(Contracts.TransactionEntityTable.id, transactionId));
            const [entry] = yield* testDb
                .select()
                .from(Contracts.TransactionEntryEntityTable)
                .where(eq(Contracts.TransactionEntryEntityTable.transactionId, transactionId));

            expect(transaction?.title).toBe('Original imported deposit expense');
            expect(transaction?.comment).toBe('original');
            expect(entry?.amount).toBe(IMPORT_INITIAL_AMOUNT);
            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * Contracts.PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
