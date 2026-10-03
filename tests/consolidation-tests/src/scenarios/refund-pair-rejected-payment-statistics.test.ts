import { DEFAULT_TRANSACTION_FILTER, StatisticsRepository, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    REJECTED_PAYMENT_EXPENSE_AMOUNT,
    REJECTED_PAYMENT_FEE_AMOUNT,
    REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS,
    REJECTED_PAYMENT_FEE_TITLE,
    REJECTED_PAYMENT_PRINCIPAL_TITLE
} from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DEFAULT_INSTRUMENT_ID = 1;

layer(TestLayer)('consolidation/refund-pair-rejected-payment-statistics', it => {
    it.effect('nets an over-primary PrivatBank rejected-payment refund (principal + fee absorbed) to zero', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'privat-card' });
            const { expense } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: 'FOP TESTOVYI PRODUCTS',
                expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
                expenseFeeAmount: REJECTED_PAYMENT_FEE_AMOUNT,
                refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT, REJECTED_PAYMENT_FEE_AMOUNT],
                refundTitles: [REJECTED_PAYMENT_PRINCIPAL_TITLE, REJECTED_PAYMENT_FEE_TITLE],
                refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS
            });

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(2);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );

            const statisticsRepository = yield* StatisticsRepository;
            const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, DEFAULT_INSTRUMENT_ID);

            expect(totals.expense).toBe(0);
            expect(totals.income).toBe(0);
        })
    );
});
