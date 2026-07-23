import { PRECISION, StatisticsRepository, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService } from '../harness/test-context';

import type { TransactionFilterInterface } from '@budgie/contracts';

const NO_FILTERS: TransactionFilterInterface = { types: null, date: null, categoryIds: null, accountIds: null, tagIds: null };
const REJECTED_PAYMENT_PRINCIPAL_TITLE =
    'Повернення коштів за забракованим платежем від 23.06.2026 р. на суму 41003.00 UAH на адресу Yehorov Ihor Vitaliiovych (ID платежу повернення 586959892)';
const REJECTED_PAYMENT_AMOUNT_UAH = 41_003;
const REJECTED_PAYMENT_EXPENSE_AMOUNT = REJECTED_PAYMENT_AMOUNT_UAH * PRECISION;
const REJECTED_PAYMENT_FEE_TITLE = 'Повернення комісій за використання кредитних коштів';
const REJECTED_PAYMENT_FEE_AMOUNT = 820_060_000;
const REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS = 60;
const DEFAULT_INSTRUMENT_ID = 1;

describe('consolidation/refund-pair-rejected-payment-statistics', () => {
    it('nets an over-primary PrivatBank rejected-payment refund (principal + fee absorbed) to zero', async () => {
        const account = testSeedService.account({ externalId: 'privat-card' });
        const { expense } = testSeedService.refundedExpense({
            accountId: account.id,
            title: 'FOP TESTOVYI PRODUCTS',
            expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
            expenseFeeAmount: REJECTED_PAYMENT_FEE_AMOUNT,
            refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT, REJECTED_PAYMENT_FEE_AMOUNT],
            refundTitles: [REJECTED_PAYMENT_PRINCIPAL_TITLE, REJECTED_PAYMENT_FEE_TITLE],
            refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS
        });

        const result = await runConsolidation();
        expect(result.consolidated).toBe(2);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const statisticsRepository = new StatisticsRepository(testDb);
        const [totals] = statisticsRepository.getTotalIncomeAndExpenseQuery(NO_FILTERS, DEFAULT_INSTRUMENT_ID).all();

        expect(totals.expense).toBe(0);
        expect(totals.income).toBe(0);
    });
});
