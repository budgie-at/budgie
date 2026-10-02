import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategoryEntityTable,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    LENDING_CATEGORY_ID,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionDebtSettlementService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { fetchAccountBalance, fetchDebtProgress, seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type {
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

const OPENED_AMOUNT = 300 * PRECISION;
const SETTLED_AMOUNT = 100 * PRECISION;
const OVERPAID_AMOUNT = 400 * PRECISION;
const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const fetchPrimaryEntry = (transactionId: number) =>
    Effect.gen(function* () {
        const entry = (yield* testDb.select().from(TransactionEntryEntityTable)).find(
            row => row.transactionId === transactionId && row.kind === TransactionEntryKindEnum.PRIMARY
        );

        if (!isDefined(entry)) {
            throw new Error(`Primary entry for transaction ${transactionId} not found`);
        }

        return entry;
    });

const fetchDebtEvents = (debtAccountId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, debtAccountId));
    });

const fetchAccountEntries = (accountId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId));
    });

const createCashAccount = () =>
    Effect.gen(function* () {
        return yield* seed.account({ title: 'Category cash account', type: AccountTypeEnum.BANK_SYNC });
    });

const createDebtAccount = (debtType: AccountDebtTypeEnum) =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            title: 'Category debt account',
            type: AccountTypeEnum.DEBT,
            debtType,
            targetBalance: OPENED_AMOUNT
        });

        yield* insertOne(DebtEventEntityTable, {
            debtAccountId: account.id,
            direction: DebtEventDirectionEnum.OPEN,
            source: DebtEventSourceEnum.OPENING,
            amount: OPENED_AMOUNT,
            operatedAt: OPERATED_AT
        });

        return account;
    });

const createUncategorizedIncomeOnLentDebt = (amount = SETTLED_AMOUNT) =>
    Effect.gen(function* () {
        const cashAccount = yield* createCashAccount();
        const debtAccount = yield* createDebtAccount(AccountDebtTypeEnum.LENT);
        const transaction = yield* createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, null, amount);

        return { debtAccount, transaction };
    });

const createSettlementTransaction = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    cashAccountId: number,
    categoryId: number | null,
    amount = SETTLED_AMOUNT
) =>
    Effect.gen(function* () {
        const isExpense = type === TransactionTypeEnum.EXPENSE;
        const transaction = yield* insertOne(TransactionEntityTable, {
            type,
            title: isExpense ? 'Grocery store' : 'Alex returned money',
            externalId: null,
            externalSource: ExternalSourceEnum.MONOBANK,
            operatedAt: OPERATED_AT,
            comment: '',
            exchangeRate: 1,
            updatedBy: null,
            fromAccountId: isExpense ? cashAccountId : null,
            toAccountId: isExpense ? null : cashAccountId
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: cashAccountId,
            type: isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: amount,
            toIban: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const createUserCategorizedIncomeFixture = () =>
    Effect.gen(function* () {
        const userCategory = (yield* testDb.select().from(CategoryEntityTable)).find(
            row => row.id !== LENDING_CATEGORY_ID && row.id !== BORROWING_CATEGORY_ID
        );

        if (!isDefined(userCategory)) {
            throw new Error('No non-debt category seeded');
        }

        const cashAccount = yield* createCashAccount();
        const debtAccount = yield* createDebtAccount(AccountDebtTypeEnum.LENT);
        const transaction = yield* createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, userCategory.id);

        return { debtAccount, transaction, userCategory };
    });

const attachAndReadEntry = Effect.fnUntraced(function* (transactionId: number, debtAccountId: number) {
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    yield* transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    return yield* fetchPrimaryEntry(transactionId);
});

const expectUserCategoryPreserved = (entry: TransactionEntryEntityInterface, userCategoryId: number): void => {
    expect(entry.categoryId).toBe(userCategoryId);
    expect(entry.categorySource).toBe(CategorySourceEnum.USER);
};

const attachDetachAndReadEntry = Effect.fnUntraced(function* (transactionId: number, debtAccountId: number) {
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    yield* transactionDebtSettlementService.attach({ transactionId, debtAccountId });
    yield* transactionDebtSettlementService.detach(transactionId);

    return yield* fetchPrimaryEntry(transactionId);
});

const readExpenseTotal = Effect.fnUntraced(function* (instrumentId: number) {
    const statisticsRepository = yield* StatisticsRepository;
    const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, instrumentId)).at(0);

    return totals?.expense ?? -1;
});

const fetchNullCategoryExpenseRows = Effect.fnUntraced(function* (instrumentId: number) {
    const statisticsRepository = yield* StatisticsRepository;

    return (yield* statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN)).filter(
        row => !isDefined(row.category)
    );
});

describe('debt settlement categorization', () => {
    it.effect.each([
        {
            debtType: AccountDebtTypeEnum.LENT,
            type: TransactionTypeEnum.INCOME as const,
            categoryId: LENDING_CATEGORY_ID,
            expectedBalance: OPENED_AMOUNT - SETTLED_AMOUNT
        },
        {
            debtType: AccountDebtTypeEnum.BORROW,
            type: TransactionTypeEnum.EXPENSE as const,
            categoryId: BORROWING_CATEGORY_ID,
            expectedBalance: SETTLED_AMOUNT - OPENED_AMOUNT
        }
    ])('categorizes and repays a $debtType debt when attaching an uncategorized $type', ({ debtType, type, categoryId, expectedBalance }) =>
        Effect.gen(function* () {
            const cashAccount = yield* createCashAccount();
            const debtAccount = yield* createDebtAccount(debtType);
            const transaction = yield* createSettlementTransaction(type, cashAccount.id, null);

            const entry = yield* attachAndReadEntry(transaction.id, debtAccount.id);
            const progress = yield* fetchDebtProgress(debtAccount.id);

            expect(entry.categoryId).toBe(categoryId);
            expect(entry.categorySource).toBe(CategorySourceEnum.DEBT_SETTLEMENT);
            expect((yield* fetchDebtEvents(debtAccount.id)).at(1)?.direction).toBe(DebtEventDirectionEnum.CLOSE);
            expect(progress.paidAmount).toBe(SETTLED_AMOUNT);
            expect(progress.totalAmount).toBe(OPENED_AMOUNT);
            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(expectedBalance);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('assigns Lending and grows the debt when attaching an uncategorized expense to a lent debt', () =>
        Effect.gen(function* () {
            const cashAccount = yield* createCashAccount();
            const debtAccount = yield* createDebtAccount(AccountDebtTypeEnum.LENT);
            const transaction = yield* createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);

            const entry = yield* attachAndReadEntry(transaction.id, debtAccount.id);
            const progress = yield* fetchDebtProgress(debtAccount.id);

            expect(entry.categoryId).toBe(LENDING_CATEGORY_ID);
            expect((yield* fetchDebtEvents(debtAccount.id)).at(1)?.direction).toBe(DebtEventDirectionEnum.OPEN);
            expect(progress.totalAmount).toBe(OPENED_AMOUNT + SETTLED_AMOUNT);
            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(OPENED_AMOUNT + SETTLED_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates no entry on the debt account when attaching', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const { debtAccount, transaction } = yield* createUncategorizedIncomeOnLentDebt();

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

            const settlementEntries = (yield* testDb.select().from(TransactionEntryEntityTable)).filter(
                entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT
            );

            expect(yield* fetchAccountEntries(debtAccount.id)).toHaveLength(0);
            expect(settlementEntries).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('moves the attached expense out of Uncategorized without changing the expense total', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const cashAccount = yield* createCashAccount();
            const debtAccount = yield* createDebtAccount(AccountDebtTypeEnum.BORROW);
            const transaction = yield* createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);
            const expenseBefore = yield* readExpenseTotal(cashAccount.instrumentId);

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

            const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(
                DEFAULT_TRANSACTION_FILTER,
                cashAccount.instrumentId,
                LanguageEnum.EN
            );

            expect(yield* readExpenseTotal(cashAccount.instrumentId)).toBe(expenseBefore);
            expect(categoryRows.find(row => row.category?.id === BORROWING_CATEGORY_ID)?.amount).toBe(SETTLED_AMOUNT);
            expect(yield* fetchNullCategoryExpenseRows(cashAccount.instrumentId)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never clobbers an existing category when attaching', () =>
        Effect.gen(function* () {
            const { debtAccount, transaction, userCategory } = yield* createUserCategorizedIncomeFixture();

            const entry = yield* attachAndReadEntry(transaction.id, debtAccount.id);

            expectUserCategoryPreserved(entry, userCategory.id);
            expect(yield* fetchDebtEvents(debtAccount.id)).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reverts only the settlement-sourced category on detach', () =>
        Effect.gen(function* () {
            const { debtAccount, transaction } = yield* createUncategorizedIncomeOnLentDebt();

            const entry = yield* attachDetachAndReadEntry(transaction.id, debtAccount.id);

            expect(entry.categoryId).toBeNull();
            expect(entry.categorySource).toBe(CategorySourceEnum.USER);
            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(OPENED_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a user category on detach of a categorized income attachment', () =>
        Effect.gen(function* () {
            const { debtAccount, transaction, userCategory } = yield* createUserCategorizedIncomeFixture();

            const entry = yield* attachDetachAndReadEntry(transaction.id, debtAccount.id);

            expectUserCategoryPreserved(entry, userCategory.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('caps an overpaying attachment at a zero ledger balance', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const { debtAccount, transaction } = yield* createUncategorizedIncomeOnLentDebt(OVERPAID_AMOUNT);

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

            const progress = yield* fetchDebtProgress(debtAccount.id);

            expect(progress.outstandingAmount).toBe(0);
            expect(progress.overpaidAmount).toBe(OVERPAID_AMOUNT - OPENED_AMOUNT);
            expect(progress.percentage).toBe(100);
            expect(yield* fetchAccountBalance(debtAccount.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
