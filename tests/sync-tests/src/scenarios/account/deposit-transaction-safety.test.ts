import {
    AccountBalanceEntityTable,
    AccountBalanceRepository,
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionService, TransferCreationService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { getErrorMessage } from '@rnw-community/shared';

import { buildTransferInput, fetchCachedBalanceAmount, seed, seedLedgerBalance, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OPERATED_AT_YEAR = 2026;
const LEGACY_EXPENSE_AMOUNT = 100 * PRECISION;
const LEGACY_INCOME_AMOUNT = 40 * PRECISION;
const LEGACY_NEGATIVE_BALANCE = 0 - LEGACY_EXPENSE_AMOUNT;
const IMPROVED_LEGACY_NEGATIVE_BALANCE = LEGACY_NEGATIVE_BALANCE + LEGACY_INCOME_AMOUNT;
const IMPORTED_EXTERNAL_ID = 'deposit-imported-expense';
const IMPORTED_INITIAL_AMOUNT = 20 * PRECISION;
const IMPORTED_UPDATED_AMOUNT = 30;
const DEPOSIT_EXPENSE_ERROR = 'Deposit accounts cannot fund expenses';
const NEGATIVE_DEPOSIT_BALANCE_ERROR = 'Deposit balance cannot become negative';
const OPERATED_AT = new Date(OPERATED_AT_YEAR, 0, 15, 12, 0, 0);

const buildExpenseInput = (accountId: number, amount: number) => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'Deposit expense',
    amount,
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: accountId,
    toAccountId: null,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ]
});

const buildIncomeInput = (accountId: number, amount: number) => ({
    type: TransactionTypeEnum.INCOME,
    title: 'Deposit income',
    amount,
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: null,
    toAccountId: accountId,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ]
});

const buildImportedExpenseInput = (accountId: number) => {
    const input = buildExpenseInput(accountId, IMPORTED_UPDATED_AMOUNT);

    return {
        ...input,
        title: 'Updated imported deposit expense',
        comment: 'updated',
        externalId: IMPORTED_EXTERNAL_ID,
        externalSource: ExternalSourceEnum.MONOBANK,
        entries: input.entries.map(entry => ({ ...entry, externalId: IMPORTED_EXTERNAL_ID, exchangeRate: 1, toIban: null }))
    };
};

const seedBalance = (accountId: number, amount: number) =>
    Effect.gen(function* () {
        yield* insertOne(AccountBalanceEntityTable, {
            accountId,
            amount,
            updatedAt: OPERATED_AT
        });
    });

const seedExpenseLedgerTransaction = (
    accountId: number,
    amount: number,
    externalId: string | null = null,
    externalSource: ExternalSourceEnum | null = null
) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.EXPENSE,
            title: 'Legacy deposit expense',
            externalId,
            comment: '',
            operatedAt: OPERATED_AT,
            fromAccountId: accountId,
            toAccountId: null,
            exchangeRate: 1,
            externalSource,
            updatedBy: null,
            needsEmbedding: false
        });

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null,
            externalId,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null,
            originalTransactionId: null
        });
    });

const fetchComputedBalance = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getByAccountId(accountId)).at(0)?.balance ?? 0;
});

const expectFailureMessage = Effect.fnUntraced(function* <A, E, R>(effect: Effect.Effect<A, E, R>, message: string) {
    const exit = yield* Effect.exit(effect);

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
        expect(getErrorMessage(Cause.squash(exit.cause))).toContain(message);
    }
});

const fetchTransactionCount = () =>
    Effect.gen(function* () {
        return (yield* testDb.select().from(TransactionEntityTable)).length;
    });

const fetchTransactionEntryCount = () =>
    Effect.gen(function* () {
        return (yield* testDb.select().from(TransactionEntryEntityTable)).length;
    });

describe('account/deposit-transaction-safety', () => {
    it.effect('rejects creating an expense from a funded deposit without changing rows or balances', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const depositAccount = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });

            yield* seedLedgerBalance(depositAccount.id, 100 * PRECISION);

            yield* expectFailureMessage(transactionService.createInternal(buildExpenseInput(depositAccount.id, 40)), DEPOSIT_EXPENSE_ERROR);

            expect(yield* fetchTransactionCount()).toBe(1);
            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * PRECISION);
            expect(yield* fetchComputedBalance(depositAccount.id)).toBe(100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects updating an existing transaction into a deposit expense and preserves the original transaction', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const transactionRepository = yield* TransactionRepository;
            const bankAccount = yield* seed.account({ type: AccountTypeEnum.BANK });
            const depositAccount = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            const transaction = yield* transactionService.createInternal(buildExpenseInput(bankAccount.id, 20));

            yield* seedLedgerBalance(depositAccount.id, 100 * PRECISION);

            yield* expectFailureMessage(
                transactionService.updateById(transaction.id, buildExpenseInput(depositAccount.id, 30)),
                DEPOSIT_EXPENSE_ERROR
            );

            const preservedTransaction = yield* transactionRepository.getByIdWithEntries(transaction.id);

            expect(preservedTransaction?.type).toBe(TransactionTypeEnum.EXPENSE);
            expect(preservedTransaction?.fromAccountId).toBe(bankAccount.id);
            expect(preservedTransaction?.entries.map(entry => entry.accountId)).toEqual([bankAccount.id]);
            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects imported updates that would keep an existing deposit expense and preserves imported rows', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const depositAccount = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });

            yield* seedExpenseLedgerTransaction(
                depositAccount.id,
                IMPORTED_INITIAL_AMOUNT,
                IMPORTED_EXTERNAL_ID,
                ExternalSourceEnum.MONOBANK
            );
            yield* seedLedgerBalance(depositAccount.id, 100 * PRECISION);

            yield* expectFailureMessage(
                transactionService.bulkUpdateImported([buildImportedExpenseInput(depositAccount.id)]),
                DEPOSIT_EXPENSE_ERROR
            );

            const [importedTransaction] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, IMPORTED_EXTERNAL_ID));
            const [importedEntry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, IMPORTED_EXTERNAL_ID));

            expect(importedTransaction?.title).toBe('Legacy deposit expense');
            expect(importedTransaction?.comment).toBe('');
            expect(importedEntry?.amount).toBe(IMPORTED_INITIAL_AMOUNT);
            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an overdrawing transfer from a deposit and rolls back transaction rows and balances', () =>
        Effect.gen(function* () {
            const transferCreationService = yield* TransferCreationService;
            const depositAccount = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            const bankAccount = yield* seed.account({ type: AccountTypeEnum.BANK });

            yield* seedLedgerBalance(depositAccount.id, 50 * PRECISION);

            yield* expectFailureMessage(
                transferCreationService.createInternalTransfer(buildTransferInput(depositAccount.id, bankAccount.id, 70, OPERATED_AT)),
                NEGATIVE_DEPOSIT_BALANCE_ERROR
            );

            expect(yield* fetchTransactionCount()).toBe(1);
            expect(yield* fetchTransactionEntryCount()).toBe(1);
            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(50 * PRECISION);
            expect(yield* fetchComputedBalance(depositAccount.id)).toBe(50 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('allows improving a pre-existing negative deposit balance but rejects worsening it', () =>
        Effect.gen(function* () {
            const transferCreationService = yield* TransferCreationService;
            const transactionService = yield* TransactionService;
            const depositAccount = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });

            yield* seedExpenseLedgerTransaction(depositAccount.id, LEGACY_EXPENSE_AMOUNT);
            yield* seedBalance(depositAccount.id, LEGACY_NEGATIVE_BALANCE);

            yield* transactionService.createInternal(buildIncomeInput(depositAccount.id, 40));

            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(IMPROVED_LEGACY_NEGATIVE_BALANCE);

            yield* expectFailureMessage(
                transferCreationService.createInternalTransfer(
                    buildTransferInput(depositAccount.id, (yield* seed.account()).id, 50, OPERATED_AT)
                ),
                NEGATIVE_DEPOSIT_BALANCE_ERROR
            );

            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(IMPROVED_LEGACY_NEGATIVE_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('allows a full rebuild when a legacy negative deposit balance is unchanged', () =>
        Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const depositAccount = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });

            yield* seedExpenseLedgerTransaction(depositAccount.id, LEGACY_EXPENSE_AMOUNT);
            yield* seedBalance(depositAccount.id, LEGACY_NEGATIVE_BALANCE);

            yield* accountBalanceIncrementalService.updateAllBalances(true);

            expect(yield* fetchCachedBalanceAmount(depositAccount.id)).toBe(LEGACY_NEGATIVE_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );
});
