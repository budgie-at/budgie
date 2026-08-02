import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    REJECTED_PAYMENT_EXPENSE_AMOUNT,
    REJECTED_PAYMENT_FEE_AMOUNT,
    REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS,
    REJECTED_PAYMENT_FEE_TITLE,
    REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT,
    REJECTED_PAYMENT_HIGH_FEE_PRIMARY_AMOUNT,
    REJECTED_PAYMENT_PRINCIPAL_TITLE,
    REJECTED_PAYMENT_PRINCIPAL_TITLE_ALL_CAPS
} from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, testSeedService } from '../harness/test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

const REJECTED_PAYMENT_YEAR = 2026;
const REJECTED_PAYMENT_ORIGINAL_OPERATED_AT = new Date(REJECTED_PAYMENT_YEAR, 5, 23, 12, 24, 0);
const REJECTED_PAYMENT_RETRY_OPERATED_AT = new Date(REJECTED_PAYMENT_YEAR, 5, 23, 14, 29, 0);
const UNRELATED_INCOME_OPERATED_AT = new Date(REJECTED_PAYMENT_YEAR, 5, 23, 13, 40, 0);
const UNRELATED_INCOME_AMOUNT_UAH = 41_000;
const UNRELATED_INCOME_AMOUNT = UNRELATED_INCOME_AMOUNT_UAH * PRECISION;

const seedRetryExpense = (accountId: number, externalIdPrefix: string) =>
    testSeedService.refundedExpense({
        accountId,
        title: 'FOP TESTOVYI PRODUCTS',
        expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
        refundAmounts: [],
        expenseOperatedAt: REJECTED_PAYMENT_RETRY_OPERATED_AT,
        externalIdPrefix
    }).expense;

const seedRejectedPaymentFullCycle = (accountId: number, externalIdPrefix: string) =>
    testSeedService.refundedExpense({
        accountId,
        title: 'FOP TESTOVYI PRODUCTS',
        expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
        expenseFeeAmount: REJECTED_PAYMENT_FEE_AMOUNT,
        refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT, REJECTED_PAYMENT_FEE_AMOUNT],
        refundTitles: [REJECTED_PAYMENT_PRINCIPAL_TITLE, REJECTED_PAYMENT_FEE_TITLE],
        expenseOperatedAt: REJECTED_PAYMENT_ORIGINAL_OPERATED_AT,
        refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS,
        externalIdPrefix
    });

const runConsolidationAndAssertSingleRefund = async (expenseId: number, refundId: number) => {
    const result = await runConsolidation();

    expect(result.consolidated).toBe(1);
    expect(testQueryService.fetchTransactionById(expenseId).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
    expect(testQueryService.fetchTransactionById(refundId).consolidationParentTransactionId).toBe(expenseId);

    return result;
};

const expectBothRefundsConsolidatedToExpense = (expenseId: number, refunds: TransactionEntityInterface[]) => {
    expect(testQueryService.fetchTransactionById(expenseId).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
    expect(refunds.map(refund => testQueryService.fetchTransactionById(refund.id).consolidationParentTransactionId)).toEqual([
        expenseId,
        expenseId
    ]);
};

const runRejectedPaymentPrincipalRefundScenarioAndAssert = async (refundTitle: string) => {
    const { consolidated, expense, refunds } = await runRefundScenario({
        title: 'FOP TESTOVYI PRODUCTS',
        refundTitle,
        expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
        refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT],
        refundDelaySeconds: 4_380
    });

    expect(consolidated).toBe(1);
    expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
    expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
};

describe('consolidation/refund-pair-rejected-payment', () => {
    it('auto-consolidates a PrivatBank rejected-payment principal refund matched by title prefix', async () => {
        await runRejectedPaymentPrincipalRefundScenarioAndAssert(REJECTED_PAYMENT_PRINCIPAL_TITLE);
    });

    it('auto-consolidates an ALL-CAPS PrivatBank rejected-payment principal refund matched by title prefix', async () => {
        await runRejectedPaymentPrincipalRefundScenarioAndAssert(REJECTED_PAYMENT_PRINCIPAL_TITLE_ALL_CAPS);
    });

    it('does not consolidate a same-title retry expense that occurs after the refund income', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: 'FOP TESTOVYI PRODUCTS',
            refundTitle: REJECTED_PAYMENT_PRINCIPAL_TITLE,
            expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
            refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT],
            expenseOperatedAt: REJECTED_PAYMENT_ORIGINAL_OPERATED_AT,
            refundDelaySeconds: 4_380,
            externalIdPrefix: 'rejected-payment-original'
        });
        const retryExpense = seedRetryExpense(account.id, 'rejected-payment-retry');

        await runConsolidationAndAssertSingleRefund(expense.id, refunds[0].id);

        expect(testQueryService.fetchTransactionById(retryExpense.id).consolidationType).toBeNull();
        expect(testQueryService.fetchTransactionById(retryExpense.id).consolidationParentTransactionId).toBeNull();
    });

    it('auto-consolidates a PrivatBank fee-return refund matched to the expense FEE entry amount', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: 'FOP TESTOVYI PRODUCTS',
            refundTitle: REJECTED_PAYMENT_FEE_TITLE,
            expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
            expenseFeeAmount: REJECTED_PAYMENT_FEE_AMOUNT,
            refundAmounts: [REJECTED_PAYMENT_FEE_AMOUNT],
            refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS
        });

        await runConsolidationAndAssertSingleRefund(expense.id, refunds[0].id);
    });

    it('auto-consolidates a PrivatBank fee-return refund when the FEE entry exceeds the primary CREDIT amount', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: 'FOP TESTOVYI PRODUCTS',
            refundTitle: REJECTED_PAYMENT_FEE_TITLE,
            expenseAmount: REJECTED_PAYMENT_HIGH_FEE_PRIMARY_AMOUNT,
            expenseFeeAmount: REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT,
            refundAmounts: [REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT],
            refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS
        });

        await runConsolidationAndAssertSingleRefund(expense.id, refunds[0].id);
    });

    it('does not match a fee-return refund title when the expense has no FEE entry', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        testSeedService.refundedExpense({
            accountId: account.id,
            title: 'FOP TESTOVYI PRODUCTS',
            refundTitle: REJECTED_PAYMENT_FEE_TITLE,
            expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
            refundAmounts: [REJECTED_PAYMENT_FEE_AMOUNT],
            refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS
        });

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
    });
});

describe('consolidation/refund-pair-rejected-payment full cycle', () => {
    it('absorbs both the principal and fee refunds from a full PrivatBank rejected-payment cycle', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const otherAccount = testSeedService.account({ externalId: 'mono-other' });
        const { expense, refunds } = seedRejectedPaymentFullCycle(account.id, 'rejected-payment-full');
        const retryExpense = seedRetryExpense(account.id, 'rejected-payment-full-retry');
        const unrelatedIncome = testSeedService.bankPairIncome(
            { externalId: 'unrelated-income', operatedAt: UNRELATED_INCOME_OPERATED_AT },
            { accountId: otherAccount.id, amount: UNRELATED_INCOME_AMOUNT }
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(2);
        expectBothRefundsConsolidatedToExpense(expense.id, refunds);
        expect(
            testQueryService
                .fetchEntriesByTransactionId(expense.id)
                .filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                .map(entry => entry.amount)
                .sort((left, right) => left - right)
        ).toEqual([REJECTED_PAYMENT_FEE_AMOUNT, REJECTED_PAYMENT_EXPENSE_AMOUNT]);
        expect(testQueryService.fetchTransactionById(retryExpense.id)).toMatchObject({
            consolidationParentTransactionId: null,
            consolidationType: null
        });
        expect(testQueryService.fetchTransactionById(unrelatedIncome.id).consolidationParentTransactionId).toBeNull();
    });

    it('consolidates zero on a second run and keeps the expense entry layout unchanged', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const { expense, refunds } = seedRejectedPaymentFullCycle(account.id, 'rejected-payment-idempotent');

        const firstResult = await runConsolidation();
        const secondResult = await runConsolidation();

        expect(firstResult.consolidated).toBe(2);
        expect(secondResult.consolidated).toBe(0);
        expectBothRefundsConsolidatedToExpense(expense.id, refunds);

        const expenseEntries = testQueryService.fetchEntriesByTransactionId(expense.id);
        const entryCountsByType = {
            credit: expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT).length,
            fee: expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE).length,
            debit: expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT).length
        };

        expect(entryCountsByType).toEqual({ credit: 1, fee: 1, debit: 2 });
        expect(
            expenseEntries
                .filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                .map(entry => entry.amount)
                .sort((left, right) => left - right)
        ).toEqual([REJECTED_PAYMENT_FEE_AMOUNT, REJECTED_PAYMENT_EXPENSE_AMOUNT]);
    });
});
