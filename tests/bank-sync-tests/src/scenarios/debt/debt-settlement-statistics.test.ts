import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    accountBalanceRepository,
    exchangeRateRepository,
    historicalExchangeRateRepository,
    settingsRepository,
    statisticsRepository,
    transactionRepository
} from '@app/@generic/drizzle/db/db';
import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { accountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { accountService } from '@app/account/service/account.service';
import { buildDebtAccountProgressSummary } from '@app/account/utils/build-debt-account-progress-summary.util';
import { transactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { AccountEntityInterface, TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const CURRENT_USD_TO_EUR_RATE = 0.7;
const HISTORICAL_USD_TO_EUR_RATE = 0.8;
const HISTORICAL_USD_TO_EUR_RATE_DATE = '1999-01-01';

afterEach(() => {
    vi.useRealTimers();
});

describe('debt settlement statistics', () => {
    it('counts debt returns once in income analytics while updating the lent debt balance', () => {
        const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(300 * PRECISION);

        createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        expectDebtSettlementAnalyticsState({
            categoryId: category.id,
            cashAccountId: cashAccount.id,
            debtAccountId: debtAccount.id,
            debtType: AccountDebtTypeEnum.LENT,
            expectedCategoryAmount: 100 * PRECISION,
            expectedCashBalance: -200 * PRECISION,
            expectedDebtBalance: 200 * PRECISION,
            expectedExpense: 300 * PRECISION,
            expectedIncome: 100 * PRECISION,
            expectedRemainingDebt: 200 * PRECISION,
            instrumentId: cashAccount.instrumentId,
            transactionType: TransactionTypeEnum.INCOME
        });
    });

    it('attaches an income transaction to a lent debt and closes the lent balance', async () => {
        const { cashBalance, debtBalance, settlementEntry } = await attachTransactionToFundedLentDebt({
            transactionType: TransactionTypeEnum.INCOME,
            debtTargetAmount: 300 * PRECISION
        });

        expect(cashBalance?.balance).toBe(-200 * PRECISION);
        expect(debtBalance?.balance).toBe(200 * PRECISION);
        expect(settlementEntry?.type).toBe(TransactionEntryTypeEnum.CREDIT);
        expect(settlementEntry?.amount).toBe(100 * PRECISION);
    });

    it('attaches an expense transaction to a lent debt and increases the lent balance', async () => {
        const { cashBalance, debtBalance, settlementEntry } = await attachTransactionToFundedLentDebt({
            transactionType: TransactionTypeEnum.EXPENSE,
            debtTargetAmount: 500 * PRECISION
        });

        expect(cashBalance?.balance).toBe(-400 * PRECISION);
        expect(debtBalance?.balance).toBe(400 * PRECISION);
        expect(settlementEntry?.type).toBe(TransactionEntryTypeEnum.DEBIT);
        expect(settlementEntry?.amount).toBe(100 * PRECISION);
    });

    it('creates lent debt accounts by treating current balance as an already returned amount', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, 1);
        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(2_000 * PRECISION);
    });

    it('updates lent debt accounts by treating current balance as an already returned amount', async () => {
        const { balance } = await updateDebtCurrentBalanceAndReadState({
            debtType: AccountDebtTypeEnum.LENT,
            initialCurrentBalance: 0,
            updatedCurrentBalance: 2_000,
            targetBalance: 15_000
        });

        expect(balance?.balance).toBe(2_000 * PRECISION);
    });

    it('summarizes updated lent debt accounts by treating current balance as an already returned amount', async () => {
        const { balance, summary } = await updateDebtCurrentBalanceAndReadState({
            debtType: AccountDebtTypeEnum.LENT,
            initialCurrentBalance: 0,
            updatedCurrentBalance: 2_000,
            targetBalance: 15_000
        });

        expect(balance?.balance).toBe(2_000 * PRECISION);
        expectDebtProgressSummary(summary, 13_000 * PRECISION, 2_000 * PRECISION, 15_000 * PRECISION, 13.33);
    });

    it('summarizes lent debt returns from the returned amount input and attached income', async () => {
        const { summary } = await createLentDebtIncomeSettlementScenario({ initialCurrentBalance: 2_000 });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('uses lent ledger entries instead of a stale signed balance when debt activity exists', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 2_000 * PRECISION,
            closedAmount: 109 * PRECISION,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('uses borrowed ledger entries instead of a stale signed balance when debt activity exists', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -15_000 * PRECISION,
            closedAmount: 2_109 * PRECISION,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('treats a positive borrowed balance as already repaid when debt activity exists', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: 4_100 * PRECISION,
            closedAmount: 3_966 * PRECISION,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 36_934 * PRECISION, 8_066 * PRECISION, 45_000 * PRECISION, 17.92);
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

    it('summarizes lent debt progress against the original target amount', () => {
        expectOriginalTargetDebtProgressSummary(AccountDebtTypeEnum.LENT);
    });

    it('keeps the lent target amount as the denominator when ledger activity settles the debt', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 0,
            closedAmount: 2_100 * PRECISION,
            openedExtraAmount: 0,
            openedPrincipalAmount: 100 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 0, 15_000 * PRECISION, 15_000 * PRECISION, 100);
    });

    it('summarizes a lent debt target as outstanding before any ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 0,
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 13_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 13_000 * PRECISION, 0, 13_000 * PRECISION, 0);
    });

    it('summarizes lent debt from the returned balance when no ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 2_000 * PRECISION,
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 13_000 * PRECISION, 2_000 * PRECISION, 15_000 * PRECISION, 13.33);
    });

    it('stores historical base valuation on debt account adjustment entries at creation', async () => {
        const { euroInstrument, usdInstrument } = await setupUsdDebtExchangeRateScenario();
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, usdInstrument.id);
        const adjustmentEntry = findAdjustmentEntry(account.id);

        expect(account.targetBaseInstrumentId).toBe(euroInstrument.id);
        expect(account.targetBaseExchangeRate).toBe(HISTORICAL_USD_TO_EUR_RATE);
        expect(account.targetBaseAmount).toBe(12_000 * PRECISION);
        expect(adjustmentEntry?.baseInstrumentId).toBe(euroInstrument.id);
        expect(adjustmentEntry?.baseExchangeRate).toBe(HISTORICAL_USD_TO_EUR_RATE);
        expect(adjustmentEntry?.baseAmount).toBe(1_600 * PRECISION);
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

    it('summarizes lent debt as complete when signed balance is negative and no ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: -100 * PRECISION,
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 0, 15_000 * PRECISION, 15_000 * PRECISION, 100);
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
        const summary = buildDebtAccountProgressSummary({
            debtType: row.account.debtType,
            balance: convertFromMicroUnits(row.convertedBalance),
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: convertFromMicroUnits(row.convertedTargetBalance)
        });

        expectDebtProgressSummary(summary, 13_000, 0, 13_000, 0);
    });

    it('summarizes borrowed debt progress against the original target amount', () => {
        expectOriginalTargetDebtProgressSummary(AccountDebtTypeEnum.BORROW);
    });

    it('keeps the borrowed target amount as the denominator when ledger activity settles the debt', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: 0,
            closedAmount: 8_066 * PRECISION,
            openedExtraAmount: 0,
            openedPrincipalAmount: 8_066 * PRECISION,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 0, 45_000 * PRECISION, 45_000 * PRECISION, 100);
    });

    it('summarizes a borrowed debt target as outstanding before any ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: 0,
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 45_000 * PRECISION, 0, 45_000 * PRECISION, 0);
    });

    it('summarizes borrowed debt from the signed balance when no ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -8_066 * PRECISION,
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 8_066 * PRECISION, 36_934 * PRECISION, 45_000 * PRECISION, 82.08);
    });

    it('summarizes borrowed debt from the already repaid balance when no ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: 100 * PRECISION,
            closedAmount: 0,
            openedExtraAmount: 0,
            openedPrincipalAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 44_900 * PRECISION, 100 * PRECISION, 45_000 * PRECISION, 0.22);
    });

    it('creates borrowed debt accounts with a negative outstanding balance', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.BORROW, 8_066, 45_000, 1);
        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(-8_066 * PRECISION);
    });

    it('updates borrowed debt accounts with a negative outstanding balance', async () => {
        const { balance } = await updateDebtCurrentBalanceAndReadState({
            debtType: AccountDebtTypeEnum.BORROW,
            initialCurrentBalance: 8_066,
            updatedCurrentBalance: 1_900,
            targetBalance: 15_000
        });

        expect(balance?.balance).toBe(-1_900 * PRECISION);
    });

    it('counts debt repayments once in expense analytics while updating the borrowed debt balance', () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({
            title: 'I owe Alex',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.BORROW,
            targetBalance: 300 * PRECISION
        });

        createDebtTransferTransaction(debtAccount.id, cashAccount.id, 300 * PRECISION, 'Borrow money from Alex');
        createDebtRepaymentExpense(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        expectDebtSettlementAnalyticsState({
            categoryId: category.id,
            cashAccountId: cashAccount.id,
            debtAccountId: debtAccount.id,
            debtType: AccountDebtTypeEnum.BORROW,
            expectedCategoryAmount: 100 * PRECISION,
            expectedCashBalance: 200 * PRECISION,
            expectedDebtBalance: -200 * PRECISION,
            expectedExpense: 100 * PRECISION,
            expectedIncome: 0,
            expectedRemainingDebt: 200 * PRECISION,
            instrumentId: cashAccount.instrumentId,
            transactionType: TransactionTypeEnum.EXPENSE
        });
    });

    it('summarizes borrowed debt after repayment expense and additional borrowed income', async () => {
        const { summary } = await createBorrowedDebtSettlementScenario();

        expectDebtProgressSummary(summary, 13_109 * PRECISION, 2_000 * PRECISION, 15_109 * PRECISION, 13.24);
    });

    it('uses canonical borrowed outstanding in remaining debt totals', async () => {
        const { remainingBorrowedDebt } = await createBorrowedDebtSettlementScenario();

        expect(remainingBorrowedDebt?.total).toBe(13_109 * PRECISION);
    });

    it('returns canonical borrowed progress in home account rows', async () => {
        const { cashAccount, debtAccount } = await createBorrowedDebtSettlementScenario();
        const row = findHomeRow(debtAccount.id, cashAccount.instrumentId);

        expect(row).toBeDefined();

        if (!isDefined(row)) {
            return;
        }

        expect(row.debtOutstandingAmount).toBe(13_109 * PRECISION);
        expect(row.debtPaidAmount).toBe(2_000 * PRECISION);
        expect(row.debtTotalAmount).toBe(15_109 * PRECISION);
        expect(row.debtProgressPercentage).toBe(13.24);
    });

    it('returns canonical borrowed progress in debt account details', async () => {
        const { debtAccount } = await createBorrowedDebtSettlementScenario();
        const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(debtAccount.id).get();

        expect(progress).toBeDefined();

        if (!isDefined(progress)) {
            return;
        }

        expect(progress.outstandingAmount).toBe(13_109 * PRECISION);
        expect(progress.paidAmount).toBe(2_000 * PRECISION);
        expect(progress.totalAmount).toBe(15_109 * PRECISION);
        expect(progress.percentage).toBe(13.24);
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

        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.LENT);

        expectDebtProgressSummary(summary, 0, 300 * PRECISION, 300 * PRECISION, 100);
    });

    it('creates a lent debt account from a real outgoing transfer without an opening adjustment', async () => {
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await accountDebtOpeningService.createLentDebtFromTransfer(
            {
                title: 'Oleh owes me',
                iban: null,
                icon: UserIconNameEnum.HandCoins,
                instrumentId: cashAccount.instrumentId,
                type: AccountTypeEnum.DEBT,
                debtType: AccountDebtTypeEnum.LENT,
                currentBalance: 500,
                targetBalance: 500,
                contactId: null,
                deadline: null
            },
            cashAccount.id
        );
        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.LENT);
        const adjustmentEntry = findAdjustmentEntry(debtAccount.id);

        expect(adjustmentEntry).toBeUndefined();
        expectDebtProgressSummary(summary, 500 * PRECISION, 0, 500 * PRECISION, 0);
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

        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.BORROW);
        const adjustmentEntry = findAdjustmentEntry(debtAccount.id);

        expect(adjustmentEntry).toBeUndefined();
        expectDebtProgressSummary(summary, 600 * PRECISION, 0, 600 * PRECISION, 0);
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

const createFundedLentDebtFixture = (targetBalance: number) => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance });

    createDebtTransferTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION, 'Lend money to Alex');

    return { category, cashAccount, debtAccount };
};

const attachTransactionToFundedLentDebt = async ({
    transactionType,
    debtTargetAmount
}: {
    readonly transactionType: TransactionTypeEnum;
    readonly debtTargetAmount: number;
}) => {
    const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(debtTargetAmount);
    const transaction =
        transactionType === TransactionTypeEnum.INCOME
            ? createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION)
            : createExpenseTransaction(cashAccount.id, category.id, 100 * PRECISION);

    return await attachDebtSettlementAndReadState(transaction.id, cashAccount.id, debtAccount.id);
};

const attachDebtSettlementAndReadState = async (transactionId: number, cashAccountId: number, debtAccountId: number) => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    const cashBalance = accountBalanceRepository.getByAccountId(cashAccountId).get();
    const debtBalance = accountBalanceRepository.getByAccountId(debtAccountId).get();
    const settlementEntry = testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .find(entry => entry.transactionId === transactionId && entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);

    return { cashBalance, debtBalance, settlementEntry };
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

const expectOriginalTargetDebtProgressSummary = (debtType: AccountDebtTypeEnum): void => {
    const summary = buildDebtAccountProgressSummary({
        debtType,
        balance: 0,
        closedAmount: 2_100 * PRECISION,
        openedExtraAmount: 0,
        openedPrincipalAmount: 10_000 * PRECISION,
        targetAmount: 15_000 * PRECISION
    });

    expectDebtProgressSummary(summary, 7_900 * PRECISION, 7_100 * PRECISION, 15_000 * PRECISION, 47.33);
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
    const summary = buildSummaryFromDebtAccount(account, debtType);

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
    const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.LENT);

    return { cashAccount, debtAccount, row, summary };
};

const createBorrowedDebtSettlementScenario = async () => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = await createDebtAccount(AccountDebtTypeEnum.BORROW, 15_000, 15_000, cashAccount.instrumentId);
    const repayment = createExpenseTransaction(cashAccount.id, category.id, 2_000 * PRECISION);

    await transactionDebtSettlementService.attach({ transactionId: repayment.id, debtAccountId: debtAccount.id });

    const additionalBorrowing = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

    await transactionDebtSettlementService.attach({ transactionId: additionalBorrowing.id, debtAccountId: debtAccount.id });

    const remainingBorrowedDebt = accountBalanceRepository
        .getTotalRemainingDebtByType(cashAccount.instrumentId, AccountDebtTypeEnum.BORROW)
        .get();
    const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.BORROW);

    return { cashAccount, debtAccount, remainingBorrowedDebt, summary };
};

const createBorrowedDebtCoveredOpeningScenario = () => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = seed.account({
        title: 'Covered borrowed account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.BORROW,
        targetBalance: 45_000 * PRECISION
    });

    createDebtAdjustmentTransaction(debtAccount.id, 4_100 * PRECISION);
    createDebtRepaymentExpense(cashAccount.id, debtAccount.id, category.id, 3_966 * PRECISION);

    const row = findHomeRow(debtAccount.id, cashAccount.instrumentId);

    return { debtAccount, row };
};

const buildSummaryFromDebtAccount = (debtAccount: Pick<AccountEntityInterface, 'id' | 'targetBalance'>, debtType: AccountDebtTypeEnum) => {
    const adjustmentDebitAmount = getDebtEntryAmount(
        debtAccount.id,
        TransactionEntryTypeEnum.DEBIT,
        TransactionEntryKindEnum.PRIMARY,
        TransactionTypeEnum.ADJUSTMENT
    );
    const adjustmentCreditAmount = getDebtEntryAmount(
        debtAccount.id,
        TransactionEntryTypeEnum.CREDIT,
        TransactionEntryKindEnum.PRIMARY,
        TransactionTypeEnum.ADJUSTMENT
    );
    const debitSettlementAmount = getDebtEntryAmount(
        debtAccount.id,
        TransactionEntryTypeEnum.DEBIT,
        TransactionEntryKindEnum.DEBT_SETTLEMENT,
        null
    );
    const creditSettlementAmount = getDebtEntryAmount(
        debtAccount.id,
        TransactionEntryTypeEnum.CREDIT,
        TransactionEntryKindEnum.DEBT_SETTLEMENT,
        null
    );
    const debtPrimaryDebitAmount = getDebtEntryAmount(
        debtAccount.id,
        TransactionEntryTypeEnum.DEBIT,
        TransactionEntryKindEnum.PRIMARY,
        TransactionTypeEnum.DEBT
    );
    const debtPrimaryCreditAmount = getDebtEntryAmount(
        debtAccount.id,
        TransactionEntryTypeEnum.CREDIT,
        TransactionEntryKindEnum.PRIMARY,
        TransactionTypeEnum.DEBT
    );
    const closedAmount =
        debtType === AccountDebtTypeEnum.BORROW
            ? debtPrimaryDebitAmount + debitSettlementAmount
            : debtPrimaryCreditAmount + creditSettlementAmount;
    const openedPrincipalAmount = debtType === AccountDebtTypeEnum.BORROW ? debtPrimaryCreditAmount : debtPrimaryDebitAmount;
    const openedExtraAmount = debtType === AccountDebtTypeEnum.BORROW ? creditSettlementAmount : debitSettlementAmount;

    return buildDebtAccountProgressSummary({
        debtType,
        balance: adjustmentDebitAmount - adjustmentCreditAmount,
        closedAmount,
        openedExtraAmount,
        openedPrincipalAmount,
        targetAmount: debtAccount.targetBalance
    });
};

const findHomeRow = (accountId: number, instrumentId: number) =>
    accountBalanceRepository
        .getHomeAccountRows(instrumentId)
        .all()
        .find(row => row.account.id === accountId);

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

const getDebtEntryAmount = (
    debtAccountId: number,
    type: TransactionEntryTypeEnum,
    kind: TransactionEntryKindEnum,
    transactionType: TransactionTypeEnum | null
): number => {
    const transactions = testDb.select().from(TransactionEntityTable).all();

    return testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .filter(entry => {
            const transaction = transactions.find(item => item.id === entry.transactionId);
            const isTransactionTypeMatch = !isDefined(transactionType) || transaction?.type === transactionType;

            return entry.accountId === debtAccountId && entry.type === type && entry.kind === kind && isTransactionTypeMatch;
        })
        .reduce((total, entry) => total + entry.amount, 0);
};

const expectDebtProgressSummary = (
    summary: ReturnType<typeof buildDebtAccountProgressSummary>,
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

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: fromAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: toAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });
};

const createDebtReturnIncome = (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): void => {
    const transaction = createIncomeTransaction(cashAccountId, categoryId, amount);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
        amount,
        categoryId
    });
};

const createDebtRepaymentExpense = (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.EXPENSE,
        title: 'Return money to Alex',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: cashAccountId,
        toAccountId: null
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
        amount,
        categoryId
    });
};

const createDebtAdjustmentTransaction = (debtAccountId: number, amount: number): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.ADJUSTMENT,
        title: 'Already covered borrowed amount',
        externalSource: null,
        fromAccountId: null,
        toAccountId: debtAccountId
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
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

const createExpenseTransaction = (cashAccountId: number, categoryId: number, amount: number) => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.EXPENSE,
        title: 'Lend more money to Alex',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: cashAccountId,
        toAccountId: null
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    return transaction;
};

const createTransaction = (
    transaction: Pick<TransactionCreateEntityInterface, 'type' | 'title' | 'externalSource' | 'fromAccountId' | 'toAccountId'>
) =>
    insertOne(TransactionEntityTable, {
        ...transaction,
        externalId: null,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

const createTransactionEntry = (
    entry: Pick<TransactionEntryCreateEntityInterface, 'transactionId' | 'accountId' | 'type' | 'kind' | 'amount' | 'categoryId'>
): void => {
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
};
