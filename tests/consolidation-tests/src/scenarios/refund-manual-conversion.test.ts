import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { LanguageEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { refundConsolidationService, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/refund-manual-conversion', it => {
    it.effect('manually converts when the income and expense already share a tag', () =>
        Effect.gen(function* () {
            const { expense, refunds } = testSeedService.refundedExpense({
                accountId: testSeedService.account({ externalId: 'mono-card' }).id,
                expenseAmount: convertToMicroUnits(120),
                refundAmounts: [convertToMicroUnits(40)]
            });
            const tag = testSeedService.tag('Shared');

            testSeedService.transactionTag(expense.id, tag.id);
            testSeedService.transactionTag(refunds[0].id, tag.id);

            const canonicalTransactionId = yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: refunds[0].id,
                expenseTransactionId: expense.id
            });

            expect(canonicalTransactionId).toBe(expense.id);
            expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
            expect(testQueryService.fetchTransactionTagIds(expense.id)).toHaveLength(1);
        })
    );

    it.effect('finds refundable expenses only from refund income transactions', () =>
        Effect.gen(function* () {
            const { expense, refunds } = testSeedService.refundedExpense({
                accountId: testSeedService.account({ externalId: 'mono-card' }).id,
                expenseAmount: convertToMicroUnits(120),
                externalIdPrefix: 'manual-refund',
                refundAmounts: [convertToMicroUnits(40)],
                refundTitle: 'Apple Store refund',
                title: 'Apple Store'
            });

            const incomeCandidates = yield* refundConsolidationService.findRefundableExpenses(refunds[0].id, '', LanguageEnum.EN);
            const expenseCandidates = yield* refundConsolidationService.findRefundableExpenses(expense.id, '', LanguageEnum.EN);

            expect(incomeCandidates).toMatchObject([{ id: expense.id }]);
            expect(expenseCandidates).toEqual([]);
        })
    );

    it.effect('rejects a sequential refund that exceeds the remaining expense amount', () =>
        Effect.gen(function* () {
            const { expense, refunds } = testSeedService.refundedExpense({
                accountId: testSeedService.account({ externalId: 'mono-card' }).id,
                expenseAmount: convertToMicroUnits(120),
                refundAmounts: [convertToMicroUnits(80), convertToMicroUnits(50)]
            });

            yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: refunds[0].id,
                expenseTransactionId: expense.id
            });

            expect(
                yield* Effect.flip(
                    refundConsolidationService.convertToRefund({
                        refundIncomeTransactionId: refunds[1].id,
                        expenseTransactionId: expense.id
                    })
                )
            ).toMatchObject({ _tag: 'RefundExceedsExpenseError', message: 'Refund amount cannot exceed the expense' });

            expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
            expect(testQueryService.fetchTransactionById(refunds[1].id).consolidationParentTransactionId).toBeNull();
            expect(
                testQueryService
                    .fetchEntriesByTransactionId(expense.id)
                    .filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                    .map(entry => entry.amount)
            ).toEqual([convertToMicroUnits(80)]);
        })
    );
});
