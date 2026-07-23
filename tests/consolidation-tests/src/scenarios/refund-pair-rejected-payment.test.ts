import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, testSeedService } from '../harness/test-context';

const REJECTED_PAYMENT_PRINCIPAL_TITLE =
    'Повернення коштів за забракованим платежем від 23.06.2026 р. на суму 41003.00 UAH на адресу Yehorov Ihor Vitaliiovych (ID платежу повернення 586959892)';
const REJECTED_PAYMENT_AMOUNT_UAH = 41_003;
const REJECTED_PAYMENT_EXPENSE_AMOUNT = REJECTED_PAYMENT_AMOUNT_UAH * PRECISION;
const REJECTED_PAYMENT_YEAR = 2026;
const REJECTED_PAYMENT_ORIGINAL_OPERATED_AT = new Date(REJECTED_PAYMENT_YEAR, 5, 23, 12, 24, 0);
const REJECTED_PAYMENT_RETRY_OPERATED_AT = new Date(REJECTED_PAYMENT_YEAR, 5, 23, 14, 29, 0);
const REJECTED_PAYMENT_FEE_TITLE = 'Повернення комісій за використання кредитних коштів';
const REJECTED_PAYMENT_FEE_AMOUNT = 820_060_000;
const REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS = 60;

describe('consolidation/refund-pair-rejected-payment', () => {
    it('auto-consolidates a PrivatBank rejected-payment principal refund matched by title prefix', async () => {
        const { consolidated, expense, refunds } = await runRefundScenario({
            title: 'FOP TESTOVYI PRODUCTS',
            refundTitle: REJECTED_PAYMENT_PRINCIPAL_TITLE,
            expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
            refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT],
            refundDelaySeconds: 4_380
        });

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
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
        const retryExpense = testSeedService.refundedExpense({
            accountId: account.id,
            title: 'FOP TESTOVYI PRODUCTS',
            expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: REJECTED_PAYMENT_RETRY_OPERATED_AT,
            externalIdPrefix: 'rejected-payment-retry'
        }).expense;

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
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

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
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
