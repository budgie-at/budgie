import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectSourcesRestored, fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import {
    REJECTED_PAYMENT_EXPENSE_AMOUNT,
    REJECTED_PAYMENT_FEE_AMOUNT,
    REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS,
    REJECTED_PAYMENT_FEE_TITLE,
    REJECTED_PAYMENT_PRINCIPAL_TITLE
} from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

const STANDALONE_REFUND_EXPENSE_AMOUNT_UAH = 120;

layer(TestLayer)('consolidation/unconsolidate-refund-restores-sources', it => {
    it.effect('restores the refund as a standalone income and clears consolidation type on the expense', () =>
        Effect.gen(function* () {
            const { expense, refunds } = yield* runRefundScenario({
                expenseAmount: STANDALONE_REFUND_EXPENSE_AMOUNT_UAH * PRECISION,
                refundAmounts: [40 * PRECISION]
            });

            expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

            yield* unconsolidateById(expense.id);

            const restoredExpense = testQueryService.fetchTransactionById(expense.id);
            expect(restoredExpense.consolidationType).toBeNull();

            const restoredRefund = testQueryService.fetchTransactionById(refunds[0].id);
            expect(restoredRefund.consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('keeps tags copied from the refund income on the expense after unconsolidating a refund', () =>
        Effect.gen(function* () {
            const tag = testSeedService.tag('Refunded order');
            const { account, expense, refunds } = yield* runRefundScenario({
                beforeConsolidation: ({ refunds }) => {
                    testSeedService.transactionTag(refunds[0].id, tag.id);
                },
                expenseAmount: STANDALONE_REFUND_EXPENSE_AMOUNT_UAH * PRECISION,
                externalIdPrefix: 'refund-tag-revert',
                refundAmounts: [STANDALONE_REFUND_EXPENSE_AMOUNT_UAH * PRECISION]
            });
            const balancesAfterConsolidation = yield* fetchLedgerBalances([account.id]);

            expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);

            yield* unconsolidateById(expense.id);

            expectSourcesRestored([refunds[0].id]);
            expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBeNull();
            expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);
            expect(yield* fetchLedgerBalances([account.id])).toEqual(balancesAfterConsolidation);
        })
    );

    it.effect(
        'restores both refund incomes and their original DEBIT entries after unconsolidating a two-income rejected-payment expense',
        () =>
            Effect.gen(function* () {
                const account = testSeedService.account({ externalId: 'privat-card' });
                const externalIdPrefix = 'rejected-payment-unconsolidate';
                const { expense, refunds } = testSeedService.refundedExpense({
                    accountId: account.id,
                    title: 'FOP TESTOVYI PRODUCTS',
                    expenseAmount: REJECTED_PAYMENT_EXPENSE_AMOUNT,
                    expenseFeeAmount: REJECTED_PAYMENT_FEE_AMOUNT,
                    refundAmounts: [REJECTED_PAYMENT_EXPENSE_AMOUNT, REJECTED_PAYMENT_FEE_AMOUNT],
                    refundTitles: [REJECTED_PAYMENT_PRINCIPAL_TITLE, REJECTED_PAYMENT_FEE_TITLE],
                    refundDelaySeconds: REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS,
                    externalIdPrefix
                });

                const result = yield* runConsolidation();

                expect(result.consolidated).toBe(2);

                yield* unconsolidateById(expense.id);

                expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBeNull();
                expect(refunds.map(refund => testQueryService.fetchTransactionById(refund.id).consolidationParentTransactionId)).toEqual([
                    null,
                    null
                ]);
                const restoredDebitEntries = refunds.map((_refund, index) =>
                    testQueryService.fetchEntryByExternalId(`${externalIdPrefix}-refund-${index}`)
                );

                expect(
                    restoredDebitEntries.map(entry => ({
                        transactionId: entry.transactionId,
                        originalTransactionId: entry.originalTransactionId
                    }))
                ).toEqual(refunds.map(refund => ({ transactionId: refund.id, originalTransactionId: null })));
            })
    );
});
