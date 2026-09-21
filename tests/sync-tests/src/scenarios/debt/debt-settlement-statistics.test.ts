import {
    accountBalanceRepository,
    debtEventRepository,
    exchangeRateRepository,
    historicalExchangeRateRepository,
    settingsRepository,
    statisticsRepository,
    transactionRepository
} from '@app/@generic/drizzle/db/db';
import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { accountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { accountService } from '@app/account/service/account.service';
import { transactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import {
    AccountEntityTable,
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    LENDING_CATEGORY_ID,
    LanguageEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type {
    AccountEntityInterface,
    DateRangeInterface,
    DebtAccountProgressSummaryInterface,
    DebtEventCreateEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
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
    it('hydrates only live entries for statistics transaction cards', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({ title: 'Debt account', type: AccountTypeEnum.DEBT });
        const transaction = createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);
        const originalTransaction = createTransaction({
            type: TransactionTypeEnum.INCOME,
            title: 'Moved source',
            externalSource: ExternalSourceEnum.MONOBANK,
            fromAccountId: null,
            toAccountId: cashAccount.id
        });

        insertOne(TransactionEntryEntityTable, {
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
        insertOne(TransactionEntryEntityTable, {
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

        const transactions = await statisticsRepository.getTransactions(
            {
                type: TransactionTypeEnum.INCOME,
                date: null,
                categoryIds: null,
                excludedCategoryIds: null,
                tagIds: null
            },
            10,
            LanguageEnum.EN
        );

        expect(transactions).toHaveLength(1);
        expect(transactions[0]?.entries).toHaveLength(1);
        expect(transactions[0]?.entries[0]?.amount).toBe(100 * PRECISION);
        expect(transactions[0]?.entries[0]?.deletedAt).toBeNull();
        expect(transactions[0]?.entries[0]?.originalTransactionId).toBeNull();
    });

    it('counts debt returns once in income analytics while updating lent debt progress', async () => {
        const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(300 * PRECISION);

        await createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        expectDebtSettlementAnalyticsState({
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
    });

    it('attaches an income transaction to a lent debt and closes the lent balance', async () => {
        const { cashBalance, debtBalance, debtEvent } = await attachTransactionToFundedLentDebt(300 * PRECISION);

        expect(cashBalance?.balance).toBe(-200 * PRECISION);
        expect(debtBalance?.balance).toBe(200 * PRECISION);
        expect(debtEvent?.direction).toBe(DebtEventDirectionEnum.CLOSE);
        expect(debtEvent?.amount).toBe(100 * PRECISION);
    });

    it('attaches an income transaction to a lent debt through an explicit debt event', async () => {
        const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(300 * PRECISION);
        const transaction = createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const debtEvent = await debtEventRepository.findByTransactionId(transaction.id);
        const storedDebtEvent = testDb
            .select()
            .from(DebtEventEntityTable)
            .all()
            .find(event => event.transactionId === transaction.id);

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
    });

    it('creates lent debt accounts with the remaining amount as a positive ledger balance', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, 1);
        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(13_000 * PRECISION);
    });

    it('updates lent debt accounts to the remaining amount as a positive ledger balance', async () => {
        const { balance } = await updateDebtCurrentBalanceAndReadState({
            debtType: AccountDebtTypeEnum.LENT,
            initialCurrentBalance: 0,
            updatedCurrentBalance: 2_000,
            targetBalance: 15_000
        });

        expect(balance?.balance).toBe(13_000 * PRECISION);
    });

    it('settles an overpaid lent debt to a zero ledger balance across a target-only update', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 20_000, 15_000, 1);

        await accountService.updateDebtById(account.id, { debtType: AccountDebtTypeEnum.LENT, targetBalance: 15_000 });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(0);
    });

    it('summarizes updated lent debt accounts by treating current balance as an already returned amount', async () => {
        const { balance, summary } = await updateDebtCurrentBalanceAndReadState({
            debtType: AccountDebtTypeEnum.LENT,
            initialCurrentBalance: 0,
            updatedCurrentBalance: 2_000,
            targetBalance: 15_000
        });

        expect(balance?.balance).toBe(13_000 * PRECISION);
        expectDebtProgressSummary(summary, 13_000 * PRECISION, 2_000 * PRECISION, 15_000 * PRECISION, 13.33);
    });

    it('summarizes lent debt returns from the returned amount input and attached income', async () => {
        const { summary } = await createLentDebtIncomeSettlementScenario({ initialCurrentBalance: 2_000 });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('summarizes lent debt after correcting returned amount and attaching income', async () => {
        const { summary } = await createLentDebtIncomeSettlementScenario({
            initialCurrentBalance: 0,
            updatedCurrentBalance: 2_000
        });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('returns canonical debt progress fields from home account rows', async () => {
        const { row } = await createLentDebtIncomeSettlementScenario({
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
    });

    it('returns canonical debt progress fields from account details rows', async () => {
        const { debtAccount } = await createLentDebtIncomeSettlementScenario({
            initialCurrentBalance: 0,
            updatedCurrentBalance: 2_000
        });
        const row = accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id).get();

        expect(row).toBeDefined();

        if (!isDefined(row)) {
            return;
        }

        expect(convertFromMicroUnits(row.outstandingAmount)).toBe(12_891);
        expect(convertFromMicroUnits(row.paidAmount)).toBe(2_109);
        expect(convertFromMicroUnits(row.totalAmount)).toBe(15_000);
        expect(row.percentage).toBe(14.06);
    });

    it('keeps target-backed lent debt partially outstanding when ledger entries exist without a returned snapshot', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({
            title: 'Target-backed lent account',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            targetBalance: 64_000 * PRECISION
        });

        createDebtTransferTransaction(cashAccount.id, debtAccount.id, 500 * PRECISION, 'Lend extra money to Alex');
        createDebtEvent({
            debtAccountId: debtAccount.id,
            transactionId: null,
            transactionEntryId: null,
            direction: DebtEventDirectionEnum.OPEN,
            source: DebtEventSourceEnum.MANUAL,
            amount: debtAccount.targetBalance,
            operatedAt: debtAccount.createdAt
        });
        await createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 6_000 * PRECISION);

        expectTargetBackedDebtProgress(debtAccount, cashAccount);
    });

    it('stores historical base valuation on the debt account at creation without an adjustment entry', async () => {
        const { euroInstrument, usdInstrument } = await setupUsdDebtExchangeRateScenario();
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, usdInstrument.id);

        expect(account.targetBaseInstrumentId).toBe(euroInstrument.id);
        expect(account.targetBaseExchangeRate).toBe(HISTORICAL_USD_TO_EUR_RATE);
        expect(account.targetBaseAmount).toBe(12_000 * PRECISION);
        expect(findAdjustmentEntry(account.id)).toBeUndefined();
    });

    it('uses stored base valuation for converted home debt progress', async () => {
        const { euroInstrument, usdInstrument } = await setupUsdDebtExchangeRateScenario();
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, usdInstrument.id);
        const row = findHomeRow(account.id, euroInstrument.id);

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
    });

    it('summarizes target-only debt from home account rows before any ledger entries exist', () => {
        const debtAccount = seed.account({
            title: 'Target only debt',
            type: AccountTypeEnum.DEBT,
            targetBalance: 13_000 * PRECISION
        });
        const row = accountBalanceRepository
            .getHomeAccountRows(debtAccount.instrumentId)
            .all()
            .find(homeRow => homeRow.account.id === debtAccount.id);

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
    });

    it('keeps target-backed borrowed debt partially outstanding when principal and repayment ledger entries exist without a snapshot', () => {
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({
            title: 'Target-backed borrowed account',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.BORROW,
            targetBalance: 64_000 * PRECISION
        });

        createDebtEvent({
            debtAccountId: debtAccount.id,
            transactionId: null,
            transactionEntryId: null,
            direction: DebtEventDirectionEnum.OPEN,
            source: DebtEventSourceEnum.MANUAL,
            amount: debtAccount.targetBalance,
            operatedAt: debtAccount.createdAt
        });
        createDebtTransferTransaction(debtAccount.id, cashAccount.id, 500 * PRECISION, 'Borrow extra money from Alex');
        createDebtTransferTransaction(cashAccount.id, debtAccount.id, 6_000 * PRECISION, 'Return money to Alex');

        expectTargetBackedDebtProgress(debtAccount, cashAccount);
    });

    it('creates borrowed debt accounts by treating current balance as an already returned amount', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.BORROW, 8_066, 45_000, 1);
        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(-36_934 * PRECISION);
    });

    it('updates borrowed debt accounts by treating current balance as an already returned amount', async () => {
        const { balance } = await updateDebtCurrentBalanceAndReadState({
            debtType: AccountDebtTypeEnum.BORROW,
            initialCurrentBalance: 8_066,
            updatedCurrentBalance: 1_900,
            targetBalance: 15_000
        });

        expect(balance?.balance).toBe(-13_100 * PRECISION);
    });

    it('tracks borrowed repayments through transfers without expense analytics', () => {
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({
            title: 'I owe Alex',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.BORROW,
            targetBalance: 300 * PRECISION
        });

        createDebtTransferTransaction(debtAccount.id, cashAccount.id, 300 * PRECISION, 'Borrow money from Alex');
        createDebtTransferTransaction(cashAccount.id, debtAccount.id, 100 * PRECISION, 'Return money to Alex');

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId).get();
        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const remainingDebt = accountBalanceRepository
            .getTotalRemainingDebtByType(cashAccount.instrumentId, AccountDebtTypeEnum.BORROW)
            .get();

        expect(totals?.income).toBe(0);
        expect(totals?.expense).toBe(0);
        expect(cashBalance?.balance).toBe(200 * PRECISION);
        expect(debtBalance?.balance).toBe(-200 * PRECISION);
        expect(remainingDebt?.total).toBe(200 * PRECISION);
    });

    it('summarizes borrowed debt after transfer repayment and additional borrowed income', async () => {
        const { summary } = await createBorrowedDebtSettlementScenario();

        expectDebtProgressSummary(summary, 13_109 * PRECISION, 2_000 * PRECISION, 15_109 * PRECISION, 13.24);
    });

    it('uses canonical borrowed outstanding in remaining debt totals', async () => {
        const { remainingBorrowedDebt } = await createBorrowedDebtSettlementScenario();

        expect(remainingBorrowedDebt?.total).toBe(13_109 * PRECISION);
    });

    it('returns canonical borrowed progress in home account rows', async () => {
        const { cashAccount, debtAccount } = await createBorrowedDebtSettlementScenario();

        expectBorrowedDebtSettlementHomeRow(debtAccount.id, cashAccount.instrumentId);
    });

    it('returns canonical borrowed progress in debt account details', async () => {
        const { debtAccount } = await createBorrowedDebtSettlementScenario();

        expectBorrowedDebtSettlementProgress(debtAccount.id);
    });

    it('summarizes borrowed debt after transfer repayment and additional borrowed income', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({
            title: 'Transfer repayment borrowed account',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.BORROW,
            targetBalance: 15_000 * PRECISION
        });
        const additionalBorrowing = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

        createDebtTransferTransaction(debtAccount.id, cashAccount.id, 15_000 * PRECISION, 'Borrow money from Alex');
        createDebtTransferTransaction(cashAccount.id, debtAccount.id, 2_000 * PRECISION, 'Return money to Alex');

        await transactionDebtSettlementService.attach({ transactionId: additionalBorrowing.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount);

        expectDebtProgressSummary(summary, 13_109 * PRECISION, 2_000 * PRECISION, 15_109 * PRECISION, 13.24);
        expectBorrowedDebtSettlementHomeRow(debtAccount.id, cashAccount.instrumentId);
        expectBorrowedDebtSettlementProgress(debtAccount.id);
    });

    it('returns canonical borrowed progress when the opening adjustment is already covered', () => {
        const { debtAccount, row } = createBorrowedDebtCoveredOpeningScenario();
        const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id).get();

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
    });

    it('summarizes fully returned lent debt as complete', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.LENT, 0, 300, cashAccount.instrumentId);
        const transaction = createIncomeTransaction(cashAccount.id, category.id, 300 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount);

        expectDebtProgressSummary(summary, 0, 300 * PRECISION, 300 * PRECISION, 100);
    });

    it('creates a lent debt account from a funding account expense without an opening adjustment', async () => {
        const debtAccount = await createFundedLentDebt();
        const summary = buildSummaryFromDebtAccount(debtAccount);
        const adjustmentEntry = findAdjustmentEntry(debtAccount.id);

        expect(adjustmentEntry).toBeUndefined();
        expect(accountBalanceRepository.getByAccountId(debtAccount.id).get()?.balance).toBe(500 * PRECISION);
        expectDebtProgressSummary(summary, 500 * PRECISION, 0, 500 * PRECISION, 0);
    });

    it('keeps a returned amount above the target when transaction events opened more than the target', async () => {
        const debtAccount = await createFundedLentDebt();

        insertOne(DebtEventEntityTable, {
            debtAccountId: debtAccount.id,
            direction: DebtEventDirectionEnum.OPEN,
            source: DebtEventSourceEnum.INCOME_ATTACHMENT,
            amount: 500 * PRECISION,
            operatedAt: new Date()
        });

        await accountService.updateDebtById(debtAccount.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 750,
            targetBalance: 500
        });

        expectDebtProgressSummary(buildSummaryFromDebtAccount(debtAccount), 250 * PRECISION, 750 * PRECISION, 1_000 * PRECISION, 75);
    });

    it('keeps a funded lent debt total unchanged when its account settings are saved', async () => {
        const debtAccount = await createFundedLentDebt();

        await accountService.updateDebtById(debtAccount.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 0,
            targetBalance: 500
        });

        expectDebtProgressSummary(buildSummaryFromDebtAccount(debtAccount), 500 * PRECISION, 0, 500 * PRECISION, 0);
    });

    it('creates a borrowed debt account from an existing income and lets later incomes increase the borrowed total', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const openingIncome = createIncomeTransaction(cashAccount.id, category.id, 500 * PRECISION);
        const debtAccount = await accountDebtOpeningService.createBorrowedDebtFromIncome(
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
        const additionalIncome = createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: additionalIncome.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount);
        const adjustmentEntry = findAdjustmentEntry(debtAccount.id);

        expect(adjustmentEntry).toBeUndefined();
        expectDebtProgressSummary(summary, 600 * PRECISION, 0, 600 * PRECISION, 0);
    });

    it.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'keeps %s debt progress stable across five repeated account settings saves',
        async debtType => {
            const account = await createDebtAccount(debtType, 0, 15_000, 1);

            insertOne(DebtEventEntityTable, {
                debtAccountId: account.id,
                direction: DebtEventDirectionEnum.CLOSE,
                source: DebtEventSourceEnum.TRANSFER,
                amount: 2_000 * PRECISION,
                operatedAt: new Date()
            });

            for (const _save of [1, 2, 3, 4, 5]) {
                const manualSettledAmount = debtEventRepository.getManualSettledAmountByAccountId(account.id).get();

                // eslint-disable-next-line no-await-in-loop -- Repeated saves must run sequentially to reproduce the drift
                await accountService.updateDebtById(account.id, {
                    debtType,
                    currentBalance: convertFromMicroUnits(manualSettledAmount?.amount ?? 0),
                    targetBalance: 15_000
                });
            }

            expectDebtProgressSummary(
                buildSummaryFromDebtAccount(account),
                13_000 * PRECISION,
                2_000 * PRECISION,
                15_000 * PRECISION,
                13.33
            );
        }
    );

    it.each([
        [AccountDebtTypeEnum.LENT, 13_000 * PRECISION],
        [AccountDebtTypeEnum.BORROW, -13_000 * PRECISION]
    ])('reports the %s ledger balance as the signed remaining amount for a manual debt', async (debtType, expectedBalance) => {
        const account = await createDebtAccount(debtType, 2_000, 15_000, 1);

        expect(accountBalanceRepository.getByAccountId(account.id).get()?.balance).toBe(expectedBalance);
    });
});

const createDebtAccount = (debtType: AccountDebtTypeEnum, currentBalance: number, targetBalance: number, instrumentId: number) =>
    accountService.createDebt({
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

const createFundedLentDebt = async () => {
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });

    return accountDebtOpeningService.openDebtWithFundingAccount(
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
};

const createFundedLentDebtFixture = (targetBalance: number) => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance });

    createDebtTransferTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION, 'Lend money to Alex');

    return { category, cashAccount, debtAccount };
};

const attachTransactionToFundedLentDebt = async (debtTargetAmount: number) => {
    const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(debtTargetAmount);
    const transaction = createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

    return await attachDebtSettlementAndReadState(transaction.id, cashAccount.id, debtAccount.id);
};

const attachDebtSettlementAndReadState = async (transactionId: number, cashAccountId: number, debtAccountId: number) => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    const cashBalance = accountBalanceRepository.getByAccountId(cashAccountId).get();
    const debtBalance = accountBalanceRepository.getByAccountId(debtAccountId).get();
    const debtEvent = await debtEventRepository.findByTransactionId(transactionId);

    return { cashBalance, debtBalance, debtEvent };
};

const expectDebtSettlementAnalyticsState = ({
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
}): void => {
    const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, instrumentId).get();
    const categoryRows =
        transactionType === TransactionTypeEnum.INCOME
            ? statisticsRepository.getIncomeByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN).all()
            : statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN).all();
    const categoryAmount = categoryRows.find(row => row.category?.id === categoryId)?.amount;
    const cashBalance = accountBalanceRepository.getByAccountId(cashAccountId).get();
    const debtBalance = accountBalanceRepository.getByAccountId(debtAccountId).get();
    const remainingDebt = accountBalanceRepository.getTotalRemainingDebtByType(instrumentId, debtType).get();
    const debtAccountTransactionCount = transactionRepository
        .countAll({ ...DEFAULT_TRANSACTION_FILTER, accountIds: [debtAccountId] })
        .get();

    expect(totals?.income).toBe(expectedIncome);
    expect(totals?.expense).toBe(expectedExpense);
    expect(categoryAmount).toBe(expectedCategoryAmount);
    expect(cashBalance?.balance).toBe(expectedCashBalance);
    expect(debtBalance?.balance).toBe(expectedDebtBalance);
    expect(remainingDebt?.total).toBe(expectedRemainingDebt);
    expect(debtAccountTransactionCount?.value).toBe(2);
};

const updateDebtCurrentBalanceAndReadState = async ({
    debtType,
    initialCurrentBalance,
    updatedCurrentBalance,
    targetBalance
}: {
    readonly debtType: AccountDebtTypeEnum;
    readonly initialCurrentBalance: number;
    readonly updatedCurrentBalance: number;
    readonly targetBalance: number;
}) => {
    const account = await createDebtAccount(debtType, initialCurrentBalance, targetBalance, 1);

    await accountService.updateDebtById(account.id, {
        debtType,
        currentBalance: updatedCurrentBalance,
        targetBalance
    });

    const balance = accountBalanceRepository.getByAccountId(account.id).get();
    const summary = buildSummaryFromDebtAccount(account);

    return { account, balance, summary };
};

const createLentDebtIncomeSettlementScenario = async ({
    initialCurrentBalance,
    updatedCurrentBalance
}: {
    readonly initialCurrentBalance: number;
    readonly updatedCurrentBalance?: number;
}) => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = await createDebtAccount(AccountDebtTypeEnum.LENT, initialCurrentBalance, 15_000, cashAccount.instrumentId);

    if (isDefined(updatedCurrentBalance)) {
        await accountService.updateDebtById(debtAccount.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: updatedCurrentBalance,
            targetBalance: 15_000
        });
    }

    const transaction = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

    await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

    const row = findHomeRow(debtAccount.id, cashAccount.instrumentId);
    const summary = buildSummaryFromDebtAccount(debtAccount);

    return { cashAccount, debtAccount, row, summary };
};

const createBorrowedDebtSettlementScenario = async () => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = await createDebtAccount(AccountDebtTypeEnum.BORROW, 0, 15_000, cashAccount.instrumentId);

    createDebtTransferTransaction(cashAccount.id, debtAccount.id, 2_000 * PRECISION, 'Return money to Alex');
    const additionalBorrowing = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

    await transactionDebtSettlementService.attach({ transactionId: additionalBorrowing.id, debtAccountId: debtAccount.id });

    const remainingBorrowedDebt = accountBalanceRepository
        .getTotalRemainingDebtByType(cashAccount.instrumentId, AccountDebtTypeEnum.BORROW)
        .get();
    const summary = buildSummaryFromDebtAccount(debtAccount);

    return { cashAccount, debtAccount, remainingBorrowedDebt, summary };
};

const createBorrowedDebtCoveredOpeningScenario = () => {
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = seed.account({
        title: 'Covered borrowed account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.BORROW,
        targetBalance: 45_000 * PRECISION
    });

    createDebtAdjustmentTransaction(debtAccount.id, 4_100 * PRECISION);
    createDebtTransferTransaction(cashAccount.id, debtAccount.id, 3_966 * PRECISION, 'Return money to Alex');

    const row = findHomeRow(debtAccount.id, cashAccount.instrumentId);

    return { debtAccount, row };
};

const buildSummaryFromDebtAccount = (debtAccount: Pick<AccountEntityInterface, 'id'>): DebtAccountProgressSummaryInterface => {
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id).get();

    if (!isDefined(progress)) {
        throw new Error(`No debt progress row for account ${debtAccount.id}`);
    }

    return progress;
};

const findHomeRow = (accountId: number, instrumentId: number) =>
    accountBalanceRepository
        .getHomeAccountRows(instrumentId)
        .all()
        .find(row => row.account.id === accountId);

const expectTargetBackedDebtProgress = (
    debtAccount: Pick<AccountEntityInterface, 'id'>,
    cashAccount: Pick<AccountEntityInterface, 'instrumentId'>
): void => {
    const summary = buildSummaryFromDebtAccount(debtAccount);
    const row = findHomeRow(debtAccount.id, cashAccount.instrumentId);
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id).get();

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
};

const expectBorrowedDebtSettlementHomeRow = (accountId: number, instrumentId: number): void => {
    const row = findHomeRow(accountId, instrumentId);

    expect(row).toBeDefined();

    if (!isDefined(row)) {
        return;
    }

    expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(13_109));
    expect(row.debtPaidAmount).toBe(convertToMicroUnits(2_000));
    expect(row.debtTotalAmount).toBe(convertToMicroUnits(15_109));
    expect(row.debtProgressPercentage).toBe(13.24);
};

const expectBorrowedDebtSettlementProgress = (accountId: number): void => {
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(accountId).get();

    expect(progress).toBeDefined();

    if (!isDefined(progress)) {
        return;
    }

    expectDebtProgressSummary(progress, convertToMicroUnits(13_109), convertToMicroUnits(2_000), convertToMicroUnits(15_109), 13.24);
};

const setupUsdDebtExchangeRateScenario = async () => {
    const euroInstrument = await requireInstrument(CurrencyEnum.EUR);
    const usdInstrument = await requireInstrument(CurrencyEnum.USD);

    await settingsRepository.update({ defaultInstrumentId: euroInstrument.id });
    await exchangeRateRepository.upsert(usdInstrument.id, euroInstrument.id, CURRENT_USD_TO_EUR_RATE, 'test');
    await historicalExchangeRateRepository.upsert({
        sourceInstrumentId: usdInstrument.id,
        targetInstrumentId: euroInstrument.id,
        rate: HISTORICAL_USD_TO_EUR_RATE,
        rateDate: HISTORICAL_USD_TO_EUR_RATE_DATE
    });
    vi.useFakeTimers({ now: new Date(`${HISTORICAL_USD_TO_EUR_RATE_DATE}T12:00:00.000Z`) });

    return { euroInstrument, usdInstrument };
};

const findAdjustmentEntry = (accountId: number) => {
    const transactions = testDb.select().from(TransactionEntityTable).all();

    return testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .find(entry => {
            const transaction = transactions.find(item => item.id === entry.transactionId);

            return entry.accountId === accountId && transaction?.type === TransactionTypeEnum.ADJUSTMENT;
        });
};

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

const createDebtTransferTransaction = (fromAccountId: number, toAccountId: number, amount: number, title: string): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.DEBT,
        title,
        externalSource: null,
        fromAccountId,
        toAccountId
    });

    const fromEntry = createTransactionEntry({
        transactionId: transaction.id,
        accountId: fromAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    const toEntry = createTransactionEntry({
        transactionId: transaction.id,
        accountId: toAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    const fromAccount = findAccountById(fromAccountId);
    const toAccount = findAccountById(toAccountId);
    const debtAccount = fromAccount.type === AccountTypeEnum.DEBT ? fromAccount : toAccount;
    const debtEntry = fromAccount.type === AccountTypeEnum.DEBT ? fromEntry : toEntry;

    createDebtEventFromTransferEntry(debtAccount, debtEntry, transaction.operatedAt);
};

const createDebtReturnIncome = async (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): Promise<void> => {
    const transaction = createIncomeTransaction(cashAccountId, categoryId, amount);

    await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId });
};

const createDebtAdjustmentTransaction = (debtAccountId: number, amount: number): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.ADJUSTMENT,
        title: 'Already covered borrowed amount',
        externalSource: null,
        fromAccountId: null,
        toAccountId: debtAccountId
    });

    const entry = createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    createDebtEvent({
        debtAccountId,
        transactionId: transaction.id,
        transactionEntryId: entry.id,
        direction: DebtEventDirectionEnum.CLOSE,
        source: DebtEventSourceEnum.MANUAL,
        amount,
        operatedAt: transaction.operatedAt
    });
};

const createIncomeTransaction = (cashAccountId: number, categoryId: number, amount: number) => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.INCOME,
        title: 'Alex returned money',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: null,
        toAccountId: cashAccountId
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    return transaction;
};

const createTransaction = (
    transaction: Pick<TransactionCreateEntityInterface, 'type' | 'title' | 'externalSource' | 'fromAccountId' | 'toAccountId'>,
    operatedAt = new Date('2026-06-02T12:00:00.000Z')
) =>
    insertOne(TransactionEntityTable, {
        ...transaction,
        externalId: null,
        operatedAt,
        comment: '',
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

const createTransactionEntry = (
    entry: Pick<TransactionEntryCreateEntityInterface, 'transactionId' | 'accountId' | 'type' | 'kind' | 'amount' | 'categoryId'>
): TransactionEntryEntityInterface =>
    insertOne(TransactionEntryEntityTable, {
        ...entry,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: entry.amount,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);

const findAccountById = (accountId: number): AccountEntityInterface => {
    const account = testDb
        .select()
        .from(AccountEntityTable)
        .all()
        .find(row => row.id === accountId);

    if (!isDefined(account)) {
        throw new Error(`Account ${accountId} not found`);
    }

    return account;
};

const createDebtEventFromTransferEntry = (
    account: AccountEntityInterface,
    entry: TransactionEntryEntityInterface,
    operatedAt: Date
): void => {
    if (account.type !== AccountTypeEnum.DEBT) {
        return;
    }

    createDebtEvent({
        debtAccountId: account.id,
        transactionId: entry.transactionId,
        transactionEntryId: entry.id,
        direction: getTransferDebtEventDirection(account.debtType, entry.type),
        source: DebtEventSourceEnum.TRANSFER,
        amount: entry.amount,
        operatedAt
    });
};

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
>): void => {
    insertOne(DebtEventEntityTable, {
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
};

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

const openFundedDebt = async (
    debtType: AccountDebtTypeEnum,
    fundingAccount: Pick<AccountEntityInterface, 'id' | 'instrumentId'>,
    targetAmount: number,
    instrumentId = fundingAccount.instrumentId
): Promise<AccountEntityInterface> =>
    accountDebtOpeningService.openDebtWithFundingAccount(
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

const createFundingAccountTransaction = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    accountId: number,
    operatedAt: Date,
    amount: number
): TransactionEntityInterface => {
    const isExpense = type === TransactionTypeEnum.EXPENSE;
    const transaction = createTransaction(
        {
            type,
            title: isExpense ? 'Sent to Alex' : 'Alex returned money',
            externalSource: ExternalSourceEnum.MONOBANK,
            fromAccountId: isExpense ? accountId : null,
            toAccountId: isExpense ? null : accountId
        },
        operatedAt
    );

    createTransactionEntry({
        transactionId: transaction.id,
        accountId,
        type: isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    return transaction;
};

const readCategoryRows = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    instrumentId: number,
    date: DateRangeInterface | null
) => {
    const filter = { ...DEFAULT_TRANSACTION_FILTER, date };

    return type === TransactionTypeEnum.EXPENSE
        ? statisticsRepository.getExpenseByCategoryQuery(filter, instrumentId, LanguageEnum.EN).all()
        : statisticsRepository.getIncomeByCategoryQuery(filter, instrumentId, LanguageEnum.EN).all();
};

const readCategoryAmount = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    categoryId: number,
    instrumentId: number,
    date: DateRangeInterface | null
): number => readCategoryRows(type, instrumentId, date).find(row => row.category?.id === categoryId)?.amount ?? 0;

const readDebtAccountEntries = (accountId: number): TransactionEntryEntityInterface[] =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId)).all();

const expectDebtTile = (
    accountId: number,
    expected: { outstandingAmount: number; overpaidAmount?: number; paidAmount: number; totalAmount: number }
): void => {
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(accountId).get();

    expect(progress).toBeDefined();

    if (!isDefined(progress)) {
        return;
    }

    expect(progress.outstandingAmount).toBe(expected.outstandingAmount);
    expect(progress.overpaidAmount).toBe(expected.overpaidAmount ?? 0);
    expect(progress.paidAmount).toBe(expected.paidAmount);
    expect(progress.totalAmount).toBe(expected.totalAmount);
};

const openJanuaryFundedDebt = async (debtType: AccountDebtTypeEnum, totalAmount: number) => {
    const fundingAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const categoryId = DEBT_V2_CATEGORY_ID_BY_DEBT_TYPE[debtType];
    const openingType = getOpeningTransactionType(debtType);
    const repaymentType = getOppositeTransactionType(openingType);

    vi.useFakeTimers({ now: DEBT_V2_JANUARY_OPERATED_AT });
    const debtAccount = await openFundedDebt(debtType, fundingAccount, totalAmount);
    vi.useRealTimers();

    return { categoryId, debtAccount, fundingAccount, openingType, repaymentType };
};

const attachMarchRepayment = async (
    fundingAccountId: number,
    debtAccountId: number,
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    amount: number,
    operatedAt = DEBT_V2_MARCH_OPERATED_AT
): Promise<TransactionEntityInterface> => {
    const repayment = createFundingAccountTransaction(type, fundingAccountId, operatedAt, amount);

    await transactionDebtSettlementService.attach({ transactionId: repayment.id, debtAccountId });

    return repayment;
};

describe('debt v2 analytics — both ways', () => {
    it.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'books a %s opening as one month of analytics and a later repayment as another, with nothing on the debt account',
        async debtType => {
            const { categoryId, debtAccount, fundingAccount, openingType, repaymentType } = await openJanuaryFundedDebt(
                debtType,
                DEBT_V2_TOTAL_AMOUNT
            );

            expect(readCategoryAmount(openingType, categoryId, fundingAccount.instrumentId, DEBT_V2_JANUARY_RANGE)).toBe(
                DEBT_V2_TOTAL_AMOUNT
            );
            expect(
                readCategoryAmount(getOppositeTransactionType(openingType), categoryId, fundingAccount.instrumentId, DEBT_V2_JANUARY_RANGE)
            ).toBe(0);

            await attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, DEBT_V2_REPAYMENT_AMOUNT);

            expect(readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(
                DEBT_V2_REPAYMENT_AMOUNT
            );
            expect(
                readCategoryAmount(getOppositeTransactionType(repaymentType), categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)
            ).toBe(0);
            expect(readCategoryAmount(openingType, categoryId, fundingAccount.instrumentId, DEBT_V2_JANUARY_RANGE)).toBe(
                DEBT_V2_TOTAL_AMOUNT
            );
            expect(readDebtAccountEntries(debtAccount.id)).toHaveLength(0);
            expectDebtTile(debtAccount.id, {
                outstandingAmount: DEBT_V2_TOTAL_AMOUNT - DEBT_V2_REPAYMENT_AMOUNT,
                paidAmount: DEBT_V2_REPAYMENT_AMOUNT,
                totalAmount: DEBT_V2_TOTAL_AMOUNT
            });
        }
    );

    it.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'aggregates a partial and a full %s repayment in the same month into one category row',
        async debtType => {
            const { categoryId, debtAccount, fundingAccount, repaymentType } = await openJanuaryFundedDebt(debtType, DEBT_V2_TOTAL_AMOUNT);

            await attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, 100 * PRECISION, DEBT_V2_MARCH_OPERATED_AT);
            await attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, 200 * PRECISION, DEBT_V2_MARCH_LATER_OPERATED_AT);

            const rows = readCategoryRows(repaymentType, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE).filter(
                row => row.category?.id === categoryId
            );

            expect(rows).toHaveLength(1);
            expect(rows[0]?.amount).toBe(300 * PRECISION);
        }
    );

    it.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'counts a %s overpayment as real money moved while the tile clamps remaining to zero',
        async debtType => {
            const overpaymentAmount = 700 * PRECISION;
            const { categoryId, debtAccount, fundingAccount, repaymentType } = await openJanuaryFundedDebt(debtType, DEBT_V2_TOTAL_AMOUNT);

            await attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, overpaymentAmount);

            expect(readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(overpaymentAmount);
            expectDebtTile(debtAccount.id, {
                outstandingAmount: 0,
                overpaidAmount: overpaymentAmount - DEBT_V2_TOTAL_AMOUNT,
                paidAmount: overpaymentAmount,
                totalAmount: DEBT_V2_TOTAL_AMOUNT
            });
        }
    );

    it('values the lent opening in the funding entry base valuation while the tile stays in the debt account instrument', async () => {
        const { euroInstrument, usdInstrument } = await setupUsdDebtExchangeRateScenario();
        const fundingAccount = seed.account({ title: 'USD account', type: AccountTypeEnum.BANK_SYNC, instrumentId: usdInstrument.id });

        const debtAccount = await openFundedDebt(AccountDebtTypeEnum.LENT, fundingAccount, DEBT_V2_TOTAL_AMOUNT, usdInstrument.id);

        const expectedBaseAmount = Math.round(DEBT_V2_TOTAL_AMOUNT * HISTORICAL_USD_TO_EUR_RATE);

        expect(readCategoryAmount(TransactionTypeEnum.EXPENSE, LENDING_CATEGORY_ID, euroInstrument.id, null)).toBe(expectedBaseAmount);
        expect(readCategoryAmount(TransactionTypeEnum.EXPENSE, LENDING_CATEGORY_ID, usdInstrument.id, null)).toBe(DEBT_V2_TOTAL_AMOUNT);
        expectDebtTile(debtAccount.id, {
            outstandingAmount: DEBT_V2_TOTAL_AMOUNT,
            paidAmount: 0,
            totalAmount: DEBT_V2_TOTAL_AMOUNT
        });
    });

    it.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'keeps a manual %s debt out of every month of analytics while the tile still tracks progress',
        async debtType => {
            const categoryId = DEBT_V2_CATEGORY_ID_BY_DEBT_TYPE[debtType];
            const account = await accountService.createDebt({
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

            expect(readCategoryAmount(TransactionTypeEnum.EXPENSE, categoryId, 1, null)).toBe(0);
            expect(readCategoryAmount(TransactionTypeEnum.INCOME, categoryId, 1, null)).toBe(0);
            expect(readDebtAccountEntries(account.id)).toHaveLength(0);
            expectDebtTile(account.id, {
                outstandingAmount: 300 * PRECISION,
                paidAmount: 200 * PRECISION,
                totalAmount: 500 * PRECISION
            });
        }
    );

    it.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])(
        'reverts a detached %s repayment to its prior category while removing it from the repaid figure',
        async debtType => {
            const { categoryId, debtAccount, fundingAccount, repaymentType } = await openJanuaryFundedDebt(debtType, DEBT_V2_TOTAL_AMOUNT);
            const repayment = await attachMarchRepayment(fundingAccount.id, debtAccount.id, repaymentType, DEBT_V2_REPAYMENT_AMOUNT);

            expect(readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(
                DEBT_V2_REPAYMENT_AMOUNT
            );

            await transactionDebtSettlementService.detach(repayment.id);

            expect(readCategoryAmount(repaymentType, categoryId, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE)).toBe(0);
            const uncategorizedRow = readCategoryRows(repaymentType, fundingAccount.instrumentId, DEBT_V2_MARCH_RANGE).find(
                row => !isDefined(row.category)
            );

            expect(uncategorizedRow?.amount).toBe(DEBT_V2_REPAYMENT_AMOUNT);
            expectDebtTile(debtAccount.id, {
                outstandingAmount: DEBT_V2_TOTAL_AMOUNT,
                paidAmount: 0,
                totalAmount: DEBT_V2_TOTAL_AMOUNT
            });
        }
    );
});
