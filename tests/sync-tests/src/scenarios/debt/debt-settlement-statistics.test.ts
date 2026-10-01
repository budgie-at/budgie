import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { DebtAccountService } from '@app/account/service/debt-account.service';
import { TransactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import {
    AccountBalanceRepository,
    AccountEntityTable,
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventRepository,
    DebtEventSourceEnum,
    ExchangeRateRepository,
    ExternalSourceEnum,
    HistoricalExchangeRateRepository,
    LENDING_CATEGORY_ID,
    LanguageEnum,
    PRECISION,
    SettingsRepository,
    StatisticsRepository,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionViewRepository,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { fetchAccountBalance, requireInstrument, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type {
    AccountEntityInterface,
    DateRangeInterface,
    DebtAccountProgressSummaryInterface,
    DebtEventCreateEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

const CURRENT_USD_TO_EUR_RATE = 0.7;
const HISTORICAL_USD_TO_EUR_RATE = 0.8;
const HISTORICAL_USD_TO_EUR_RATE_DATE = '1999-01-01';

afterEach(() => {
    vi.useRealTimers();
});

describe('debt settlement statistics', () => {
    it.effect('hydrates only live entries for statistics transaction cards', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;

            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* seed.account({ title: 'Debt account', type: AccountTypeEnum.DEBT });
            const transaction = yield* createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);
            const originalTransaction = yield* createTransaction({
                type: TransactionTypeEnum.INCOME,
                title: 'Moved source',
                externalSource: ExternalSourceEnum.MONOBANK,
                fromAccountId: null,
                toAccountId: cashAccount.id
            });

            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: transaction.id,
                accountId: debtAccount.id,
                type: TransactionEntryTypeEnum.CREDIT,
                kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
                amount: 200 * PRECISION,
                categoryId: null,
                mccCategoryId: null,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: 1,
                baseExchangeRate: 1,
                baseAmount: 200 * PRECISION,
                toIban: null,
                originalTransactionId: null,
                deletedAt: new Date('2026-06-03T12:00:00.000Z')
            });
            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: transaction.id,
                accountId: cashAccount.id,
                type: TransactionEntryTypeEnum.DEBIT,
                kind: TransactionEntryKindEnum.PRIMARY,
                amount: 300 * PRECISION,
                categoryId: category.id,
                mccCategoryId: null,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: 1,
                baseExchangeRate: 1,
                baseAmount: 300 * PRECISION,
                toIban: null,
                originalTransactionId: originalTransaction.id
            });

            const transactions = yield* statisticsRepository.getTransactions(
                {
                    type: TransactionTypeEnum.INCOME,
                    date: null,
                    categoryIds: null,
                    excludedCategoryIds: null,
                    tagIds: null,
                    accountIds: null,
                    amount: null
                },
                10,
                LanguageEnum.EN
            );

            expect(transactions).toHaveLength(1);
            expect(transactions[0]?.entries).toHaveLength(1);
            expect(transactions[0]?.entries[0]?.amount).toBe(100 * PRECISION);
            expect(transactions[0]?.entries[0]?.deletedAt).toBeNull();
            expect(transactions[0]?.entries[0]?.originalTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts debt returns once in income analytics while updating lent debt progress', () =>
        Effect.gen(function* () {
            const { category, cashAccount, debtAccount } = yield* createFundedLentDebtFixture(300 * PRECISION);

            yield* createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

            yield* expectDebtSettlementAnalyticsState({
                categoryId: category.id,
                cashAccountId: cashAccount.id,
                debtAccountId: debtAccount.id,
                debtType: AccountDebtTypeEnum.LENT,
                expectedCategoryAmount: 100 * PRECISION,
                expectedCashBalance: -200 * PRECISION,
                expectedDebtBalance: 200 * PRECISION,
                expectedExpense: 0,
                expectedIncome: 100 * PRECISION,
                expectedRemainingDebt: 200 * PRECISION,
                instrumentId: cashAccount.instrumentId,
                transactionType: TransactionTypeEnum.INCOME
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches an income transaction to a lent debt and closes the lent balance', () =>
        Effect.gen(function* () {
            const { cashBalance, debtBalance, debtEvent } = yield* attachTransactionToFundedLentDebt(300 * PRECISION);

            expect(cashBalance?.balance).toBe(-200 * PRECISION);
            expect(debtBalance?.balance).toBe(200 * PRECISION);
            expect(debtEvent?.direction).toBe(DebtEventDirectionEnum.CLOSE);
            expect(debtEvent?.amount).toBe(100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches an income transaction to a lent debt through an explicit debt event', () =>
        Effect.gen(function* () {
            const debtEventRepository = yield* DebtEventRepository;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const { category, cashAccount, debtAccount } = yield* createFundedLentDebtFixture(300 * PRECISION);
            const transaction = yield* createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

            const debtEvent = yield* debtEventRepository.findByTransactionId(transaction.id);
            const storedDebtEvent = (yield* testDb.select().from(DebtEventEntityTable)).find(
                event => event.transactionId === transaction.id
            );

            expect(debtEvent).toBeDefined();
            expect(storedDebtEvent).toBeDefined();

            if (!isDefined(debtEvent) || !isDefined(storedDebtEvent)) {
                return;
            }

            expect(debtEvent.id).toBe(storedDebtEvent.id);
            expect(debtEvent.debtAccountId).toBe(debtAccount.id);
            expect(debtEvent.transactionId).toBe(transaction.id);
            expect(debtEvent.direction).toBe(DebtEventDirectionEnum.CLOSE);
            expect(debtEvent.amount).toBe(100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates lent debt accounts with the remaining amount as a positive ledger balance', () =>
        Effect.gen(function* () {
            const account = yield* createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, 1);
            expect(yield* fetchAccountBalance(account.id)).toBe(13_000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updates lent debt accounts to the remaining amount as a positive ledger balance', () =>
        Effect.gen(function* () {
            const { balance } = yield* updateDebtCurrentBalanceAndReadState({
                debtType: AccountDebtTypeEnum.LENT,
                initialCurrentBalance: 0,
                updatedCurrentBalance: 2_000,
                targetBalance: 15_000
            });

            expect(balance?.balance).toBe(13_000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('settles an overpaid lent debt to a zero ledger balance across a target-only update', () =>
        Effect.gen(function* () {
            const debtAccountService = yield* DebtAccountService;

            const account = yield* createDebtAccount(AccountDebtTypeEnum.LENT, 20_000, 15_000, 1);

            yield* debtAccountService.updateDebtById(account.id, { debtType: AccountDebtTypeEnum.LENT, targetBalance: 15_000 });

            expect(yield* fetchAccountBalance(account.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('summarizes updated lent debt accounts by treating current balance as an already returned amount', () =>
        Effect.gen(function* () {
            const { balance, summary } = yield* updateDebtCurrentBalanceAndReadState({
                debtType: AccountDebtTypeEnum.LENT,
                initialCurrentBalance: 0,
                updatedCurrentBalance: 2_000,
                targetBalance: 15_000
            });

            expect(balance?.balance).toBe(13_000 * PRECISION);
            expectDebtProgressSummary(summary, 13_000 * PRECISION, 2_000 * PRECISION, 15_000 * PRECISION, 13.33);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('summarizes lent debt returns from the returned amount input and attached income', () =>
        Effect.gen(function* () {
            const { summary } = yield* createLentDebtIncomeSettlementScenario({ initialCurrentBalance: 2_000 });

            expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('summarizes lent debt after correcting returned amount and attaching income', () =>
        Effect.gen(function* () {
            const { summary } = yield* createLentDebtIncomeSettlementScenario({
                initialCurrentBalance: 0,
                updatedCurrentBalance: 2_000
            });

            expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns canonical debt progress fields from home account rows', () =>
        Effect.gen(function* () {
            const { row } = yield* createLentDebtIncomeSettlementScenario({
                initialCurrentBalance: 0,
                updatedCurrentBalance: 2_000
            });

            expect(row).toBeDefined();

            if (!isDefined(row)) {
                return;
            }

            expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBe(12_891);
            expect(convertFromMicroUnits(row.convertedDebtPaidAmount)).toBe(2_109);
            expect(convertFromMicroUnits(row.convertedDebtTotalAmount)).toBe(15_000);
            expect(row.debtProgressPercentage).toBe(14.06);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns canonical debt progress fields from account details rows', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const { debtAccount } = yield* createLentDebtIncomeSettlementScenario({
                initialCurrentBalance: 0,
                updatedCurrentBalance: 2_000
            });
            const row = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id)).at(0);

            expect(row).toBeDefined();

            if (!isDefined(row)) {
                return;
            }

            expect(convertFromMicroUnits(row.outstandingAmount)).toBe(12_891);
            expect(convertFromMicroUnits(row.paidAmount)).toBe(2_109);
            expect(convertFromMicroUnits(row.totalAmount)).toBe(15_000);
            expect(row.percentage).toBe(14.06);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps target-backed lent debt partially outstanding when ledger entries exist without a returned snapshot', () =>
        Effect.gen(function* () {
            const { category, cashAccount } = yield* seedCategoryAndCashAccount();
            const debtAccount = yield* seed.account({
                title: 'Target-backed lent account',
                type: AccountTypeEnum.DEBT,
                debtType: AccountDebtTypeEnum.LENT,
                targetBalance: 64_000 * PRECISION
            });

            yield* createDebtTransferTransaction(cashAccount.id, debtAccount.id, 500 * PRECISION, 'Lend extra money to Alex');
            yield* createDebtEvent({
                debtAccountId: debtAccount.id,
                transactionId: null,
                transactionEntryId: null,
                direction: DebtEventDirectionEnum.OPEN,
                source: DebtEventSourceEnum.MANUAL,
                amount: debtAccount.targetBalance,
                operatedAt: debtAccount.createdAt
            });
            yield* createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 6_000 * PRECISION);

            yield* expectTargetBackedDebtProgress(debtAccount, cashAccount);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stores historical base valuation on the debt account at creation without an adjustment entry', () =>
        Effect.gen(function* () {
            const { euroInstrument, usdInstrument } = yield* setupUsdDebtExchangeRateScenario();
            const account = yield* createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, usdInstrument.id);

            expect(account.targetBaseInstrumentId).toBe(euroInstrument.id);
            expect(account.targetBaseExchangeRate).toBe(HISTORICAL_USD_TO_EUR_RATE);
            expect(account.targetBaseAmount).toBe(12_000 * PRECISION);
            expect(yield* findAdjustmentEntry(account.id)).toBeUndefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses stored base valuation for converted home debt progress', () =>
        Effect.gen(function* () {
            const { euroInstrument, usdInstrument } = yield* setupUsdDebtExchangeRateScenario();
            const account = yield* createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, usdInstrument.id);
            const row = yield* findHomeRow(account.id, euroInstrument.id);

            expect(row).toBeDefined();

            if (!isDefined(row)) {
                return;
            }

            expect(row.debtPaidAmount).toBe(2_000 * PRECISION);
            expect(row.debtOutstandingAmount).toBe(13_000 * PRECISION);
            expect(row.debtTotalAmount).toBe(15_000 * PRECISION);
            expect(row.convertedTargetBalance).toBe(12_000 * PRECISION);
            expect(row.convertedDebtPaidAmount).toBe(1_600 * PRECISION);
            expect(row.convertedDebtOutstandingAmount).toBe(10_400 * PRECISION);
            expect(row.convertedDebtTotalAmount).toBe(12_000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('summarizes target-only debt from home account rows before any ledger entries exist', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const debtAccount = yield* seed.account({
                title: 'Target only debt',
                type: AccountTypeEnum.DEBT,
                targetBalance: 13_000 * PRECISION
            });
            const row = (yield* accountBalanceRepository.getHomeAccountRows(debtAccount.instrumentId)).find(
                homeRow => homeRow.account.id === debtAccount.id
            );

            expect(row).toBeDefined();

            if (!isDefined(row)) {
                return;
            }

            expect(row.debtOutstandingAmount).toBe(13_000 * PRECISION);
            expect(row.debtPaidAmount).toBe(0);
            expect(row.debtTotalAmount).toBe(13_000 * PRECISION);
            expect(row.debtProgressPercentage).toBe(0);
            expect(row.convertedDebtOutstandingAmount).toBe(13_000 * PRECISION);
            expect(row.convertedDebtPaidAmount).toBe(0);
            expect(row.convertedDebtTotalAmount).toBe(13_000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'keeps target-backed borrowed debt partially outstanding when principal and repayment ledger entries exist without a snapshot',
        () =>
            Effect.gen(function* () {
                const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
                const debtAccount = yield* seed.account({
                    title: 'Target-backed borrowed account',
                    type: AccountTypeEnum.DEBT,
                    debtType: AccountDebtTypeEnum.BORROW,
                    targetBalance: 64_000 * PRECISION
                });

                yield* createDebtEvent({
                    debtAccountId: debtAccount.id,
                    transactionId: null,
                    transactionEntryId: null,
                    direction: DebtEventDirectionEnum.OPEN,
                    source: DebtEventSourceEnum.MANUAL,
                    amount: debtAccount.targetBalance,
                    operatedAt: debtAccount.createdAt
                });
                yield* createDebtTransferTransaction(debtAccount.id, cashAccount.id, 500 * PRECISION, 'Borrow extra money from Alex');
                yield* createDebtTransferTransaction(cashAccount.id, debtAccount.id, 6_000 * PRECISION, 'Return money to Alex');

                yield* expectTargetBackedDebtProgress(debtAccount, cashAccount);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates borrowed debt accounts by treating current balance as an already returned amount', () =>
        Effect.gen(function* () {
            const account = yield* createDebtAccount(AccountDebtTypeEnum.BORROW, 8_066, 45_000, 1);
            expect(yield* fetchAccountBalance(account.id)).toBe(-36_934 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updates borrowed debt accounts by treating current balance as an already returned amount', () =>
        Effect.gen(function* () {
            const { balance } = yield* updateDebtCurrentBalanceAndReadState({
                debtType: AccountDebtTypeEnum.BORROW,
                initialCurrentBalance: 8_066,
                updatedCurrentBalance: 1_900,
                targetBalance: 15_000
            });

            expect(balance?.balance).toBe(-13_100 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('tracks borrowed repayments through transfers without expense analytics', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const statisticsRepository = yield* StatisticsRepository;

            const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* seed.account({
                title: 'I owe Alex',
                type: AccountTypeEnum.DEBT,
                debtType: AccountDebtTypeEnum.BORROW,
                targetBalance: 300 * PRECISION
            });

            yield* createDebtTransferTransaction(debtAccount.id, cashAccount.id, 300 * PRECISION, 'Borrow money from Alex');
            yield* createDebtTransferTransaction(cashAccount.id, debtAccount.id, 100 * PRECISION, 'Return money to Alex');

            const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(
                DEFAULT_TRANSACTION_FILTER,
                cashAccount.instrumentId
            )).at(0);
            const cashBalance = (yield* accountBalanceRepository.getByAccountId(cashAccount.id)).at(0);
            const debtBalance = (yield* accountBalanceRepository.getByAccountId(debtAccount.id)).at(0);
            const remainingDebt = (yield* accountBalanceRepository.getTotalRemainingDebtByType(
                cashAccount.instrumentId,
                AccountDebtTypeEnum.BORROW
            )).at(0);

            expect(totals?.income).toBe(0);
            expect(totals?.expense).toBe(0);
            expect(cashBalance?.balance).toBe(200 * PRECISION);
            expect(debtBalance?.balance).toBe(-200 * PRECISION);
            expect(remainingDebt?.total).toBe(200 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('summarizes borrowed debt after transfer repayment and additional borrowed income', () =>
        Effect.gen(function* () {
            const { summary } = yield* createBorrowedDebtSettlementScenario();

            expectDebtProgressSummary(summary, 13_109 * PRECISION, 2_000 * PRECISION, 15_109 * PRECISION, 13.24);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses canonical borrowed outstanding in remaining debt totals', () =>
        Effect.gen(function* () {
            const { remainingBorrowedDebt } = yield* createBorrowedDebtSettlementScenario();

            expect(remainingBorrowedDebt?.total).toBe(13_109 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns canonical borrowed progress in home account rows', () =>
        Effect.gen(function* () {
            const { cashAccount, debtAccount } = yield* createBorrowedDebtSettlementScenario();

            yield* expectBorrowedDebtSettlementHomeRow(debtAccount.id, cashAccount.instrumentId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns canonical borrowed progress in debt account details', () =>
        Effect.gen(function* () {
            const { debtAccount } = yield* createBorrowedDebtSettlementScenario();

            yield* expectBorrowedDebtSettlementProgress(debtAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns canonical borrowed progress when the opening adjustment is already covered', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const { debtAccount, row } = yield* createBorrowedDebtCoveredOpeningScenario();
            const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id)).at(0);

            expect(row).toBeDefined();
            expect(progress).toBeDefined();

            if (!isDefined(row) || !isDefined(progress)) {
                return;
            }

            expect(row.debtOutstandingAmount).toBe(36_934 * PRECISION);
            expect(row.debtPaidAmount).toBe(8_066 * PRECISION);
            expect(row.debtTotalAmount).toBe(45_000 * PRECISION);
            expect(row.debtProgressPercentage).toBe(17.92);
            expect(progress.outstandingAmount).toBe(36_934 * PRECISION);
            expect(progress.paidAmount).toBe(8_066 * PRECISION);
            expect(progress.totalAmount).toBe(45_000 * PRECISION);
            expect(progress.percentage).toBe(17.92);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('summarizes fully returned lent debt as complete', () =>
        Effect.gen(function* () {
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
            const debtAccount = yield* createDebtAccount(AccountDebtTypeEnum.LENT, 0, 300, cashAccount.instrumentId);
            const transaction = yield* createIncomeTransaction(cashAccount.id, category.id, 300 * PRECISION);

            yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

            const summary = yield* buildSummaryFromDebtAccount(debtAccount);

            expectDebtProgressSummary(summary, 0, 300 * PRECISION, 300 * PRECISION, 100);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates a lent debt account from a funding account expense without an opening adjustment', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const debtAccount = yield* createFundedLentDebt();
            const summary = yield* buildSummaryFromDebtAccount(debtAccount);
            const adjustmentEntry = yield* findAdjustmentEntry(debtAccount.id);

            expect(adjustmentEntry).toBeUndefined();
            expect((yield* accountBalanceRepository.getByAccountId(debtAccount.id)).at(0)?.balance).toBe(500 * PRECISION);
            expectDebtProgressSummary(summary, 500 * PRECISION, 0, 500 * PRECISION, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a returned amount above the target when transaction events opened more than the target', () =>
        Effect.gen(function* () {
            const debtAccountService = yield* DebtAccountService;

            const debtAccount = yield* createFundedLentDebt();

            yield* insertOne(DebtEventEntityTable, {
                debtAccountId: debtAccount.id,
                direction: DebtEventDirectionEnum.OPEN,
                source: DebtEventSourceEnum.INCOME_ATTACHMENT,
                amount: 500 * PRECISION,
                operatedAt: new Date()
            });

            yield* debtAccountService.updateDebtById(debtAccount.id, {
                debtType: AccountDebtTypeEnum.LENT,
                currentBalance: 750,
                targetBalance: 500
            });

            expectDebtProgressSummary(
                yield* buildSummaryFromDebtAccount(debtAccount),
                250 * PRECISION,
                750 * PRECISION,
                1_000 * PRECISION,
                75
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a funded lent debt total unchanged when its account settings are saved', () =>
        Effect.gen(function* () {
            const debtAccountService = yield* DebtAccountService;

            const debtAccount = yield* createFundedLentDebt();

            yield* debtAccountService.updateDebtById(debtAccount.id, {
                debtType: AccountDebtTypeEnum.LENT,
                currentBalance: 0,
                targetBalance: 500
            });

            expectDebtProgressSummary(yield* buildSummaryFromDebtAccount(debtAccount), 500 * PRECISION, 0, 500 * PRECISION, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates a borrowed debt account from an existing income and lets later incomes increase the borrowed total', () =>
        Effect.gen(function* () {
            const accountDebtOpeningService = yield* AccountDebtOpeningService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
            const openingIncome = yield* createIncomeTransaction(cashAccount.id, category.id, 500 * PRECISION);
            const debtAccount = yield* accountDebtOpeningService.createBorrowedDebtFromIncome(
                {
                    title: 'I owe Oleh',
                    iban: null,
                    icon: UserIconNameEnum.HandCoins,
                    instrumentId: cashAccount.instrumentId,
                    type: AccountTypeEnum.DEBT,
                    debtType: AccountDebtTypeEnum.BORROW,
                    currentBalance: 0,
                    targetBalance: 500,
                    contactId: null,
                    deadline: null
                },
                openingIncome.id
            );
            const additionalIncome = yield* createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

            yield* transactionDebtSettlementService.attach({ transactionId: additionalIncome.id, debtAccountId: debtAccount.id });

            const summary = yield* buildSummaryFromDebtAccount(debtAccount);
            const adjustmentEntry = yield* findAdjustmentEntry(debtAccount.id);

            expect(adjustmentEntry).toBeUndefined();
            expectDebtProgressSummary(summary, 600 * PRECISION, 0, 600 * PRECISION, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'keeps %s debt progress stable across five repeated account settings saves',
        debtType =>
            Effect.gen(function* () {
                const debtEventRepository = yield* DebtEventRepository;
                const debtAccountService = yield* DebtAccountService;

                const account = yield* createDebtAccount(debtType, 0, 15_000, 1);

                yield* insertOne(DebtEventEntityTable, {
                    debtAccountId: account.id,
                    direction: DebtEventDirectionEnum.CLOSE,
                    source: DebtEventSourceEnum.TRANSFER,
                    amount: 2_000 * PRECISION,
                    operatedAt: new Date()
                });

                for (const _save of [1, 2, 3, 4, 5]) {
                    const manualSettledAmount = (yield* debtEventRepository.getManualSettledAmountByAccountId(account.id)).at(0);

                    // eslint-disable-next-line no-await-in-loop -- Repeated saves must run sequentially to reproduce the drift
                    yield* debtAccountService.updateDebtById(account.id, {
                        debtType,
                        currentBalance: convertFromMicroUnits(manualSettledAmount?.amount ?? 0),
                        targetBalance: 15_000
                    });
                }

                expectDebtProgressSummary(
                    yield* buildSummaryFromDebtAccount(account),
                    13_000 * PRECISION,
                    2_000 * PRECISION,
                    15_000 * PRECISION,
                    13.33
                );
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { debtType: AccountDebtTypeEnum.LENT, expectedBalance: 13_000 * PRECISION },
        { debtType: AccountDebtTypeEnum.BORROW, expectedBalance: -13_000 * PRECISION }
    ])('reports the $debtType ledger balance as the signed remaining amount for a manual debt', ({ debtType, expectedBalance }) =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const account = yield* createDebtAccount(debtType, 2_000, 15_000, 1);

            expect((yield* accountBalanceRepository.getByAccountId(account.id)).at(0)?.balance).toBe(expectedBalance);
        }).pipe(Effect.provide(TestLayer))
    );
});

const createDebtAccount = Effect.fnUntraced(function* (
    debtType: AccountDebtTypeEnum,
    currentBalance: number,
    targetBalance: number,
    instrumentId: number
) {
    const debtAccountService = yield* DebtAccountService;

    return yield* debtAccountService.createDebt({
        title: debtType === AccountDebtTypeEnum.LENT ? 'Nikita owes me' : 'Borrowed account',
        iban: null,
        icon: UserIconNameEnum.HandCoins,
        instrumentId,
        type: AccountTypeEnum.DEBT,
        debtType,
        currentBalance,
        targetBalance,
        contactId: null,
        deadline: null
    });
});

const createFundedLentDebt = Effect.fnUntraced(function* () {
    const accountDebtOpeningService = yield* AccountDebtOpeningService;

    const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });

    return yield* accountDebtOpeningService.openDebtWithFundingAccount(
        {
            title: 'Oleh owes me',
            iban: null,
            icon: UserIconNameEnum.HandCoins,
            instrumentId: cashAccount.instrumentId,
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 0,
            targetBalance: 500,
            contactId: null,
            deadline: null
        },
        cashAccount.id
    );
});

const seedCategoryAndCashAccount = () =>
    Effect.gen(function* () {
        const [category] = yield* testDb.select().from(CategoryEntityTable);
        const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });

        return { category, cashAccount };
    });

const createFundedLentDebtFixture = (targetBalance: number) =>
    Effect.gen(function* () {
        const { category, cashAccount } = yield* seedCategoryAndCashAccount();
        const debtAccount = yield* seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance });

        yield* createDebtTransferTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION, 'Lend money to Alex');

        return { category, cashAccount, debtAccount };
    });

const attachTransactionToFundedLentDebt = Effect.fnUntraced(function* (debtTargetAmount: number) {
    const { category, cashAccount, debtAccount } = yield* createFundedLentDebtFixture(debtTargetAmount);
    const transaction = yield* createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

    return yield* attachDebtSettlementAndReadState(transaction.id, cashAccount.id, debtAccount.id);
});

const attachDebtSettlementAndReadState = Effect.fnUntraced(function* (transactionId: number, cashAccountId: number, debtAccountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const debtEventRepository = yield* DebtEventRepository;
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    yield* transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    const cashBalance = (yield* accountBalanceRepository.getByAccountId(cashAccountId)).at(0);
    const debtBalance = (yield* accountBalanceRepository.getByAccountId(debtAccountId)).at(0);
    const debtEvent = yield* debtEventRepository.findByTransactionId(transactionId);

    return { cashBalance, debtBalance, debtEvent };
});

const expectDebtSettlementAnalyticsState = Effect.fnUntraced(function* ({
    categoryId,
    cashAccountId,
    debtAccountId,
    debtType,
    expectedCategoryAmount,
    expectedCashBalance,
    expectedDebtBalance,
    expectedExpense,
    expectedIncome,
    expectedRemainingDebt,
    instrumentId,
    transactionType
}: {
    readonly categoryId: number;
    readonly cashAccountId: number;
    readonly debtAccountId: number;
    readonly debtType: AccountDebtTypeEnum;
    readonly expectedCategoryAmount: number;
    readonly expectedCashBalance: number;
    readonly expectedDebtBalance: number;
    readonly expectedExpense: number;
    readonly expectedIncome: number;
    readonly expectedRemainingDebt: number;
    readonly instrumentId: number;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
}) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const statisticsRepository = yield* StatisticsRepository;
    const transactionViewRepository = yield* TransactionViewRepository;

    const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, instrumentId)).at(0);
    const categoryRows =
        transactionType === TransactionTypeEnum.INCOME
            ? yield* statisticsRepository.getIncomeByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN)
            : yield* statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN);
    const categoryAmount = categoryRows.find(row => row.category?.id === categoryId)?.amount;
    const cashBalance = (yield* accountBalanceRepository.getByAccountId(cashAccountId)).at(0);
    const debtBalance = (yield* accountBalanceRepository.getByAccountId(debtAccountId)).at(0);
    const remainingDebt = (yield* accountBalanceRepository.getTotalRemainingDebtByType(instrumentId, debtType)).at(0);
    const debtAccountTransactionCount = (yield* transactionViewRepository.countAll({
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: [debtAccountId]
    })).at(0);

    expect(totals?.income).toBe(expectedIncome);
    expect(totals?.expense).toBe(expectedExpense);
    expect(categoryAmount).toBe(expectedCategoryAmount);
    expect(cashBalance?.balance).toBe(expectedCashBalance);
    expect(debtBalance?.balance).toBe(expectedDebtBalance);
    expect(remainingDebt?.total).toBe(expectedRemainingDebt);
    expect(debtAccountTransactionCount?.value).toBe(2);
});

const updateDebtCurrentBalanceAndReadState = Effect.fnUntraced(function* ({
    debtType,
    initialCurrentBalance,
    updatedCurrentBalance,
    targetBalance
}: {
    readonly debtType: AccountDebtTypeEnum;
    readonly initialCurrentBalance: number;
    readonly updatedCurrentBalance: number;
    readonly targetBalance: number;
}) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const debtAccountService = yield* DebtAccountService;

    const account = yield* createDebtAccount(debtType, initialCurrentBalance, targetBalance, 1);

    yield* debtAccountService.updateDebtById(account.id, {
        debtType,
        currentBalance: updatedCurrentBalance,
        targetBalance
    });

    const balance = (yield* accountBalanceRepository.getByAccountId(account.id)).at(0);
    const summary = yield* buildSummaryFromDebtAccount(account);

    return { account, balance, summary };
});

const seedMainAccountWithDebt = Effect.fnUntraced(function* (debtType: AccountDebtTypeEnum, currentBalance: number) {
    const [category] = yield* testDb.select().from(CategoryEntityTable);
    const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = yield* createDebtAccount(debtType, currentBalance, 15_000, cashAccount.instrumentId);

    return { category, cashAccount, debtAccount };
});

const createLentDebtIncomeSettlementScenario = Effect.fnUntraced(function* ({
    initialCurrentBalance,
    updatedCurrentBalance
}: {
    readonly initialCurrentBalance: number;
    readonly updatedCurrentBalance?: number;
}) {
    const debtAccountService = yield* DebtAccountService;
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    const { category, cashAccount, debtAccount } = yield* seedMainAccountWithDebt(AccountDebtTypeEnum.LENT, initialCurrentBalance);

    if (isDefined(updatedCurrentBalance)) {
        yield* debtAccountService.updateDebtById(debtAccount.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: updatedCurrentBalance,
            targetBalance: 15_000
        });
    }

    const transaction = yield* createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

    yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

    const row = yield* findHomeRow(debtAccount.id, cashAccount.instrumentId);
    const summary = yield* buildSummaryFromDebtAccount(debtAccount);

    return { cashAccount, debtAccount, row, summary };
});

const createBorrowedDebtSettlementScenario = Effect.fnUntraced(function* () {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    const { category, cashAccount, debtAccount } = yield* seedMainAccountWithDebt(AccountDebtTypeEnum.BORROW, 0);

    yield* createDebtTransferTransaction(cashAccount.id, debtAccount.id, 2_000 * PRECISION, 'Return money to Alex');
    const additionalBorrowing = yield* createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

    yield* transactionDebtSettlementService.attach({ transactionId: additionalBorrowing.id, debtAccountId: debtAccount.id });

    const remainingBorrowedDebt = (yield* accountBalanceRepository.getTotalRemainingDebtByType(
        cashAccount.instrumentId,
        AccountDebtTypeEnum.BORROW
    )).at(0);
    const summary = yield* buildSummaryFromDebtAccount(debtAccount);

    return { cashAccount, debtAccount, remainingBorrowedDebt, summary };
});

const createBorrowedDebtCoveredOpeningScenario = Effect.fnUntraced(function* () {
    const cashAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = yield* seed.account({
        title: 'Covered borrowed account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.BORROW,
        targetBalance: 45_000 * PRECISION
    });

    yield* createDebtAdjustmentTransaction(debtAccount.id, 4_100 * PRECISION);
    yield* createDebtTransferTransaction(cashAccount.id, debtAccount.id, 3_966 * PRECISION, 'Return money to Alex');

    const row = yield* findHomeRow(debtAccount.id, cashAccount.instrumentId);

    return { debtAccount, row };
});

const buildSummaryFromDebtAccount = Effect.fnUntraced(function* (debtAccount: Pick<AccountEntityInterface, 'id'>) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id)).at(0);

    if (!isDefined(progress)) {
        throw new Error(`No debt progress row for account ${debtAccount.id}`);
    }

    return progress;
});

const findHomeRow = Effect.fnUntraced(function* (accountId: number, instrumentId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getHomeAccountRows(instrumentId)).find(row => row.account.id === accountId);
});

const expectTargetBackedDebtProgress = Effect.fnUntraced(function* (
    debtAccount: Pick<AccountEntityInterface, 'id'>,
    cashAccount: Pick<AccountEntityInterface, 'instrumentId'>
) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    const summary = yield* buildSummaryFromDebtAccount(debtAccount);
    const row = yield* findHomeRow(debtAccount.id, cashAccount.instrumentId);
    const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id)).at(0);

    expectDebtProgressSummary(summary, convertToMicroUnits(58_500), convertToMicroUnits(6_000), convertToMicroUnits(64_500), 9.3);
    expect(row).toBeDefined();
    expect(progress).toBeDefined();

    if (!isDefined(row) || !isDefined(progress)) {
        return;
    }

    expectDebtProgressSummary(progress, convertToMicroUnits(58_500), convertToMicroUnits(6_000), convertToMicroUnits(64_500), 9.3);
    expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(58_500));
    expect(row.debtPaidAmount).toBe(convertToMicroUnits(6_000));
    expect(row.debtTotalAmount).toBe(convertToMicroUnits(64_500));
    expect(row.debtProgressPercentage).toBe(9.3);
});

const expectBorrowedDebtSettlementHomeRow = Effect.fnUntraced(function* (accountId: number, instrumentId: number) {
    const row = yield* findHomeRow(accountId, instrumentId);

    expect(row).toBeDefined();

    if (!isDefined(row)) {
        return;
    }

    expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(13_109));
    expect(row.debtPaidAmount).toBe(convertToMicroUnits(2_000));
    expect(row.debtTotalAmount).toBe(convertToMicroUnits(15_109));
    expect(row.debtProgressPercentage).toBe(13.24);
});

const expectBorrowedDebtSettlementProgress = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(accountId)).at(0);

    expect(progress).toBeDefined();

    if (!isDefined(progress)) {
        return;
    }

    expectDebtProgressSummary(progress, convertToMicroUnits(13_109), convertToMicroUnits(2_000), convertToMicroUnits(15_109), 13.24);
});

const setupUsdDebtExchangeRateScenario = Effect.fnUntraced(function* () {
    const exchangeRateRepository = yield* ExchangeRateRepository;
    const settingsRepository = yield* SettingsRepository;
    const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;

    const euroInstrument = yield* requireInstrument(CurrencyEnum.EUR);
    const usdInstrument = yield* requireInstrument(CurrencyEnum.USD);

    yield* settingsRepository.update({ defaultInstrumentId: euroInstrument.id });
    yield* exchangeRateRepository.upsert(usdInstrument.id, euroInstrument.id, CURRENT_USD_TO_EUR_RATE, 'test');
    yield* historicalExchangeRateRepository.upsert({
        sourceInstrumentId: usdInstrument.id,
        targetInstrumentId: euroInstrument.id,
        rate: HISTORICAL_USD_TO_EUR_RATE,
        rateDate: HISTORICAL_USD_TO_EUR_RATE_DATE
    });
    vi.useFakeTimers({ now: new Date(`${HISTORICAL_USD_TO_EUR_RATE_DATE}T12:00:00.000Z`) });

    return { euroInstrument, usdInstrument };
});

const findAdjustmentEntry = (accountId: number) =>
    Effect.gen(function* () {
        const transactions = yield* testDb.select().from(TransactionEntityTable);

        return (yield* testDb.select().from(TransactionEntryEntityTable)).find(entry => {
            const transaction = transactions.find(item => item.id === entry.transactionId);

            return entry.accountId === accountId && transaction?.type === TransactionTypeEnum.ADJUSTMENT;
        });
    });

const expectDebtProgressSummary = (
    summary: Pick<DebtAccountProgressSummaryInterface, 'outstandingAmount' | 'paidAmount' | 'percentage' | 'totalAmount'>,
    outstandingAmount: number,
    paidAmount: number,
    totalAmount: number,
    percentage: number
): void => {
    expect(summary.outstandingAmount).toBe(outstandingAmount);
    expect(summary.paidAmount).toBe(paidAmount);
    expect(summary.totalAmount).toBe(totalAmount);
    expect(summary.percentage).toBe(percentage);
};

const createDebtTransferTransaction = (fromAccountId: number, toAccountId: number, amount: number, title: string) =>
    Effect.gen(function* () {
        const transaction = yield* createTransaction({
            type: TransactionTypeEnum.DEBT,
            title,
            externalSource: null,
            fromAccountId,
            toAccountId
        });

        const fromEntry = yield* createTransactionEntry({
            transactionId: transaction.id,
            accountId: fromAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null
        });

        const toEntry = yield* createTransactionEntry({
            transactionId: transaction.id,
            accountId: toAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null
        });

        const fromAccount = yield* findAccountById(fromAccountId);
        const toAccount = yield* findAccountById(toAccountId);
        const debtAccount = fromAccount.type === AccountTypeEnum.DEBT ? fromAccount : toAccount;
        const debtEntry = fromAccount.type === AccountTypeEnum.DEBT ? fromEntry : toEntry;

        yield* createDebtEventFromTransferEntry(debtAccount, debtEntry, transaction.operatedAt);
    });

const createDebtReturnIncome = Effect.fnUntraced(function* (
    cashAccountId: number,
    debtAccountId: number,
    categoryId: number,
    amount: number
) {
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    const transaction = yield* createIncomeTransaction(cashAccountId, categoryId, amount);

    yield* transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId });
});

const createDebtAdjustmentTransaction = (debtAccountId: number, amount: number) =>
    Effect.gen(function* () {
        const transaction = yield* createTransaction({
            type: TransactionTypeEnum.ADJUSTMENT,
            title: 'Already covered borrowed amount',
            externalSource: null,
            fromAccountId: null,
            toAccountId: debtAccountId
        });

        const entry = yield* createTransactionEntry({
            transactionId: transaction.id,
            accountId: debtAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null
        });

        yield* createDebtEvent({
            debtAccountId,
            transactionId: transaction.id,
            transactionEntryId: entry.id,
            direction: DebtEventDirectionEnum.CLOSE,
            source: DebtEventSourceEnum.MANUAL,
            amount,
            operatedAt: transaction.operatedAt
        });
    });

const createIncomeTransaction = (cashAccountId: number, categoryId: number, amount: number) =>
    Effect.gen(function* () {
        const transaction = yield* createTransaction({
            type: TransactionTypeEnum.INCOME,
            title: 'Alex returned money',
            externalSource: ExternalSourceEnum.MONOBANK,
            fromAccountId: null,
            toAccountId: cashAccountId
        });

        yield* createTransactionEntry({
            transactionId: transaction.id,
            accountId: cashAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId
        });

        return transaction;
    });

const createTransaction = (
    transaction: Pick<TransactionCreateEntityInterface, 'type' | 'title' | 'externalSource' | 'fromAccountId' | 'toAccountId'>,
    operatedAt = new Date('2026-06-02T12:00:00.000Z')
) =>
    Effect.gen(function* () {
        return yield* insertOne(TransactionEntityTable, {
            ...transaction,
            externalId: null,
            operatedAt,
            comment: '',
            exchangeRate: 1,
            updatedBy: null
        } satisfies TransactionCreateEntityInterface);
    });

const createTransactionEntry = (
    entry: Pick<TransactionEntryCreateEntityInterface, 'transactionId' | 'accountId' | 'type' | 'kind' | 'amount' | 'categoryId'>
) =>
    Effect.gen(function* () {
        return yield* insertOne(TransactionEntryEntityTable, {
            ...entry,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: entry.amount,
            toIban: null
        } satisfies TransactionEntryCreateEntityInterface);
    });

const findAccountById = (accountId: number) =>
    Effect.gen(function* () {
        const account = (yield* testDb.select().from(AccountEntityTable)).find(row => row.id === accountId);

        if (!isDefined(account)) {
            throw new Error(`Account ${accountId} not found`);
        }

        return account;
    });

const createDebtEventFromTransferEntry = (account: AccountEntityInterface, entry: TransactionEntryEntityInterface, operatedAt: Date) =>
    Effect.gen(function* () {
        if (account.type !== AccountTypeEnum.DEBT) {
            return;
        }

        yield* createDebtEvent({
            debtAccountId: account.id,
            transactionId: entry.transactionId,
            transactionEntryId: entry.id,
            direction: getTransferDebtEventDirection(account.debtType, entry.type),
            source: DebtEventSourceEnum.TRANSFER,
            amount: entry.amount,
            operatedAt
        });
    });

const getTransferDebtEventDirection = (debtType: AccountDebtTypeEnum, entryType: TransactionEntryTypeEnum): DebtEventDirectionEnum => {
    if (debtType === AccountDebtTypeEnum.LENT) {
        return entryType === TransactionEntryTypeEnum.DEBIT ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
    }

    return entryType === TransactionEntryTypeEnum.CREDIT ? DebtEventDirectionEnum.OPEN : DebtEventDirectionEnum.CLOSE;
};

const createDebtEvent = ({
    debtAccountId,
    transactionId,
    transactionEntryId,
    direction,
    source,
    amount,
    operatedAt
}: Pick<
    DebtEventCreateEntityInterface,
    'debtAccountId' | 'transactionId' | 'transactionEntryId' | 'direction' | 'source' | 'amount' | 'operatedAt'
>) =>
    Effect.gen(function* () {
        yield* insertOne(DebtEventEntityTable, {
            debtAccountId,
            transactionId,
            transactionEntryId,
            direction,
            source,
            amount,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: amount,
            operatedAt
        } satisfies DebtEventCreateEntityInterface);
    });

const DEBT_V2_JANUARY_OPERATED_AT = new Date('2026-01-15T12:00:00.000Z');
const DEBT_V2_MARCH_OPERATED_AT = new Date('2026-03-10T12:00:00.000Z');
const DEBT_V2_MARCH_LATER_OPERATED_AT = new Date('2026-03-20T12:00:00.000Z');
const DEBT_V2_JANUARY_RANGE: DateRangeInterface = {
    from: new Date('2026-01-01T00:00:00.000Z'),
    to: new Date('2026-01-31T23:59:59.999Z')
};
const DEBT_V2_MARCH_RANGE: DateRangeInterface = {
    from: new Date('2026-03-01T00:00:00.000Z'),
    to: new Date('2026-03-31T23:59:59.999Z')
};
const DEBT_V2_TOTAL_AMOUNT = 500 * PRECISION;
const DEBT_V2_REPAYMENT_AMOUNT = 200 * PRECISION;
const DEBT_V2_CATEGORY_ID_BY_DEBT_TYPE: Record<AccountDebtTypeEnum, number> = {
    [AccountDebtTypeEnum.LENT]: LENDING_CATEGORY_ID,
    [AccountDebtTypeEnum.BORROW]: BORROWING_CATEGORY_ID
};

const getOppositeTransactionType = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME =>
    type === TransactionTypeEnum.EXPENSE ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;

const getOpeningTransactionType = (debtType: AccountDebtTypeEnum): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME =>
    debtType === AccountDebtTypeEnum.LENT ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

const openFundedDebt = Effect.fnUntraced(function* (
    debtType: AccountDebtTypeEnum,
    fundingAccount: Pick<AccountEntityInterface, 'id' | 'instrumentId'>,
    targetAmount: number,
    instrumentId = fundingAccount.instrumentId
) {
    const accountDebtOpeningService = yield* AccountDebtOpeningService;

    return yield* accountDebtOpeningService.openDebtWithFundingAccount(
        {
            title: debtType === AccountDebtTypeEnum.LENT ? 'Alex owes me' : 'I owe Alex',
            iban: null,
            icon: UserIconNameEnum.HandCoins,
            instrumentId,
            type: AccountTypeEnum.DEBT,
            debtType,
            currentBalance: 0,
            targetBalance: convertFromMicroUnits(targetAmount),
            contactId: null,
            deadline: null
        },
        fundingAccount.id
    );
});

const createFundingAccountTransaction = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    accountId: number,
    operatedAt: Date,
    amount: number
) =>
    Effect.gen(function* () {
        const isExpense = type === TransactionTypeEnum.EXPENSE;
        const transaction = yield* createTransaction(
            {
                type,
                title: isExpense ? 'Sent to Alex' : 'Alex returned money',
                externalSource: ExternalSourceEnum.MONOBANK,
                fromAccountId: isExpense ? accountId : null,
                toAccountId: isExpense ? null : accountId
            },
            operatedAt
        );

        yield* createTransactionEntry({
            transactionId: transaction.id,
            accountId,
            type: isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null
        });

        return transaction;
    });

const readCategoryRows = Effect.fnUntraced(function* (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    instrumentId: number,
    date: DateRangeInterface | null
) {
    const statisticsRepository = yield* StatisticsRepository;

    const filter = { ...DEFAULT_TRANSACTION_FILTER, date };

    return type === TransactionTypeEnum.EXPENSE
        ? yield* statisticsRepository.getExpenseByCategoryQuery(filter, instrumentId, LanguageEnum.EN)
        : yield* statisticsRepository.getIncomeByCategoryQuery(filter, instrumentId, LanguageEnum.EN);
});

const readCategoryAmount = Effect.fnUntraced(function* (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    categoryId: number,
    instrumentId: number,
    date: DateRangeInterface | null
) {
    const rows = yield* readCategoryRows(type, instrumentId, date);

    return rows.find(row => row.category?.id === categoryId)?.amount ?? 0;
});

const readDebtAccountEntries = (accountId: number) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId));
    });

const expectDebtTile = Effect.fnUntraced(function* (
    accountId: number,
    expected: { outstandingAmount: number; overpaidAmount?: number; paidAmount: number; totalAmount: number }
) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(accountId)).at(0);

    expect(progress).toBeDefined();

    if (!isDefined(progress)) {
        return;
    }

    expect(progress.outstandingAmount).toBe(expected.outstandingAmount);
    expect(progress.overpaidAmount).toBe(expected.overpaidAmount ?? 0);
    expect(progress.paidAmount).toBe(expected.paidAmount);
    expect(progress.totalAmount).toBe(expected.totalAmount);
});

const openJanuaryFundedDebt = Effect.fnUntraced(function* (debtType: AccountDebtTypeEnum, totalAmount: number) {
    const fundingAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const categoryId = DEBT_V2_CATEGORY_ID_BY_DEBT_TYPE[debtType];
    const openingType = getOpeningTransactionType(debtType);
    const repaymentType = getOppositeTransactionType(openingType);

    vi.useFakeTimers({ now: DEBT_V2_JANUARY_OPERATED_AT });
    const debtAccount = yield* openFundedDebt(debtType, fundingAccount, totalAmount);
    vi.useRealTimers();

    return { categoryId, debtAccount, fundingAccount, openingType, repaymentType };
});

const attachMarchRepayment = Effect.fnUntraced(function* (
    fundingAccountId: number,
    debtAccountId: number,
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    amount: number,
    operatedAt = DEBT_V2_MARCH_OPERATED_AT
) {
    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

    const repayment = yield* createFundingAccountTransaction(type, fundingAccountId, operatedAt, amount);

    yield* transactionDebtSettlementService.attach({ transactionId: repayment.id, debtAccountId });

    return repayment;
});

describe('debt v2 analytics — both ways', () => {
    it.effect.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'books a %s opening as one month of analytics and a later repayment as another, with nothing on the debt account',
        debtType =>
            Effect.gen(function* () {
                const { categoryId, debtAccount, fundingAccount, openingType, repaymentType } = yield* openJanuaryFundedDebt(
                    debtType,
                    DEBT_V2_TOTAL_AMOUNT
                );

                expect(yield* readCategoryAmount(openingType, categoryId, fundingAccount.instrumentId, DEBT_V2_JANUARY_RANGE)).toBe(
                    DEBT_V2_TOTAL_AMOUNT
                );
                expect(
                    yield* readCategoryAmount(
                        getOppositeTransactionType(openingType),
                        categoryId,
                        fundingAccount.instrumentId,
                        DEBT_V2_JANUARY_RANGE
                    )
                ).toBe(0);

                yield* attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, DEBT_V2_REPAYMENT_AMOUNT);

                expect(yield* readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(
                    DEBT_V2_REPAYMENT_AMOUNT
                );
                expect(
                    yield* readCategoryAmount(
                        getOppositeTransactionType(repaymentType),
                        categoryId,
                        fundingAccount.instrumentId,
                        DEBT_V2_MARCH_RANGE
                    )
                ).toBe(0);
                expect(yield* readCategoryAmount(openingType, categoryId, fundingAccount.instrumentId, DEBT_V2_JANUARY_RANGE)).toBe(
                    DEBT_V2_TOTAL_AMOUNT
                );
                expect(yield* readDebtAccountEntries(debtAccount.id)).toHaveLength(0);
                yield* expectDebtTile(debtAccount.id, {
                    outstandingAmount: DEBT_V2_TOTAL_AMOUNT - DEBT_V2_REPAYMENT_AMOUNT,
                    paidAmount: DEBT_V2_REPAYMENT_AMOUNT,
                    totalAmount: DEBT_V2_TOTAL_AMOUNT
                });
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'aggregates a partial and a full %s repayment in the same month into one category row',
        debtType =>
            Effect.gen(function* () {
                const { categoryId, debtAccount, fundingAccount, repaymentType } = yield* openJanuaryFundedDebt(
                    debtType,
                    DEBT_V2_TOTAL_AMOUNT
                );

                yield* attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, 100 * PRECISION, DEBT_V2_MARCH_OPERATED_AT);
                yield* attachMarchRepayment(
                    fundingAccount.id,
                    debtAccount.id,
                    repaymentType,
                    400 * PRECISION,
                    DEBT_V2_MARCH_LATER_OPERATED_AT
                );

                const rows = (yield* readCategoryRows(repaymentType, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).filter(
                    row => row.category?.id === categoryId
                );

                expect(rows).toHaveLength(1);
                expect(rows[0]?.amount).toBe(DEBT_V2_TOTAL_AMOUNT);
                yield* expectDebtTile(debtAccount.id, {
                    outstandingAmount: 0,
                    paidAmount: DEBT_V2_TOTAL_AMOUNT,
                    totalAmount: DEBT_V2_TOTAL_AMOUNT
                });
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'counts a %s overpayment as real money moved while the tile clamps remaining to zero',
        debtType =>
            Effect.gen(function* () {
                const overpaymentAmount = 700 * PRECISION;
                const { categoryId, debtAccount, fundingAccount, repaymentType } = yield* openJanuaryFundedDebt(
                    debtType,
                    DEBT_V2_TOTAL_AMOUNT
                );

                yield* attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, overpaymentAmount);

                expect(yield* readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(
                    overpaymentAmount
                );
                yield* expectDebtTile(debtAccount.id, {
                    outstandingAmount: 0,
                    overpaidAmount: overpaymentAmount - DEBT_V2_TOTAL_AMOUNT,
                    paidAmount: overpaymentAmount,
                    totalAmount: DEBT_V2_TOTAL_AMOUNT
                });
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values the lent opening in the funding entry base valuation while the tile stays in the debt account instrument', () =>
        Effect.gen(function* () {
            const { euroInstrument, usdInstrument } = yield* setupUsdDebtExchangeRateScenario();
            const fundingAccount = yield* seed.account({
                title: 'USD account',
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: usdInstrument.id
            });

            const debtAccount = yield* openFundedDebt(AccountDebtTypeEnum.LENT, fundingAccount, DEBT_V2_TOTAL_AMOUNT, usdInstrument.id);

            const expectedBaseAmount = Math.round(DEBT_V2_TOTAL_AMOUNT * HISTORICAL_USD_TO_EUR_RATE);

            expect(yield* readCategoryAmount(TransactionTypeEnum.EXPENSE, LENDING_CATEGORY_ID, euroInstrument.id, null)).toBe(
                expectedBaseAmount
            );
            expect(yield* readCategoryAmount(TransactionTypeEnum.EXPENSE, LENDING_CATEGORY_ID, usdInstrument.id, null)).toBe(
                DEBT_V2_TOTAL_AMOUNT
            );
            yield* expectDebtTile(debtAccount.id, {
                outstandingAmount: DEBT_V2_TOTAL_AMOUNT,
                paidAmount: 0,
                totalAmount: DEBT_V2_TOTAL_AMOUNT
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'keeps a manual %s debt out of every month of analytics while the tile still tracks progress',
        debtType =>
            Effect.gen(function* () {
                const debtAccountService = yield* DebtAccountService;

                const categoryId = DEBT_V2_CATEGORY_ID_BY_DEBT_TYPE[debtType];
                const account = yield* debtAccountService.createDebt({
                    title: debtType === AccountDebtTypeEnum.LENT ? 'Manual lend' : 'Manual borrow',
                    iban: null,
                    icon: UserIconNameEnum.HandCoins,
                    instrumentId: 1,
                    type: AccountTypeEnum.DEBT,
                    debtType,
                    currentBalance: 200,
                    targetBalance: 500,
                    contactId: null,
                    deadline: null
                });

                expect(yield* readCategoryAmount(TransactionTypeEnum.EXPENSE, categoryId, 1, null)).toBe(0);
                expect(yield* readCategoryAmount(TransactionTypeEnum.INCOME, categoryId, 1, null)).toBe(0);
                expect(yield* readDebtAccountEntries(account.id)).toHaveLength(0);
                yield* expectDebtTile(account.id, {
                    outstandingAmount: 300 * PRECISION,
                    paidAmount: 200 * PRECISION,
                    totalAmount: 500 * PRECISION
                });
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'reverts a detached %s repayment to its prior category while removing it from the repaid figure',
        debtType =>
            Effect.gen(function* () {
                const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

                const { categoryId, debtAccount, fundingAccount, repaymentType } = yield* openJanuaryFundedDebt(
                    debtType,
                    DEBT_V2_TOTAL_AMOUNT
                );
                const repayment = yield* attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, DEBT_V2_REPAYMENT_AMOUNT);

                expect(yield* readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(
                    DEBT_V2_REPAYMENT_AMOUNT
                );

                yield* transactionDebtSettlementService.detach(repayment.id);

                expect(yield* readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(0);
                const uncategorizedRow = (yield* readCategoryRows(repaymentType, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).find(
                    row => !isDefined(row.category)
                );

                expect(uncategorizedRow?.amount).toBe(DEBT_V2_REPAYMENT_AMOUNT);
                yield* expectDebtTile(debtAccount.id, {
                    outstandingAmount: DEBT_V2_TOTAL_AMOUNT,
                    paidAmount: 0,
                    totalAmount: DEBT_V2_TOTAL_AMOUNT
                });
            }).pipe(Effect.provide(TestLayer))
    );
});
