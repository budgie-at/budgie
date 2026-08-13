import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

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
import { testDb, testQueryService, testSeedService, unconsolidationService } from '../harness/test-context';

const STANDALONE_REFUND_EXPENSE_AMOUNT_UAH = 120;

describe('consolidation/unconsolidate-refund-restores-sources', () => {
    it('restores the refund as a standalone income and clears consolidation type on the expense', async () => {
        const { expense, refunds } = await runRefundScenario({
            expenseAmount: STANDALONE_REFUND_EXPENSE_AMOUNT_UAH * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        await unconsolidationService.unconsolidateById(expense.id, testDb);

        const restoredExpense = testQueryService.fetchTransactionById(expense.id);
        expect(restoredExpense.consolidationType).toBeNull();

        const restoredRefund = testQueryService.fetchTransactionById(refunds[0].id);
        expect(restoredRefund.consolidationParentTransactionId).toBeNull();
    });

    it('keeps tags copied from the refund income on the expense after unconsolidating a refund', async () => {
        const tag = testSeedService.tag('Refunded order');
        const { account, expense, refunds } = await runRefundScenario({
            beforeConsolidation: ({ refunds }) => {
                testSeedService.transactionTag(refunds[0].id, tag.id);
            },
            expenseAmount: STANDALONE_REFUND_EXPENSE_AMOUNT_UAH * PRECISION,
            externalIdPrefix: 'refund-tag-revert',
            refundAmounts: [STANDALONE_REFUND_EXPENSE_AMOUNT_UAH * PRECISION]
        });
        const balancesAfterConsolidation = await fetchLedgerBalances([account.id]);

        expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);

        await unconsolidationService.unconsolidateById(expense.id, testDb);

        expectSourcesRestored([refunds[0].id]);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBeNull();
        expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);
        expect(await fetchLedgerBalances([account.id])).toEqual(balancesAfterConsolidation);
    });

    it('restores both refund incomes and their original DEBIT entries after unconsolidating a two-income rejected-payment expense', async () => {
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

        const result = await runConsolidation();

        expect(result.consolidated).toBe(2);

        await unconsolidationService.unconsolidateById(expense.id, testDb);

        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBeNull();
        expect(refunds.map(refund => testQueryService.fetchTransactionById(refund.id).consolidationParentTransactionId)).toEqual([
            null,
            null
        ]);
        const restoredDebitEntries = refunds.map((_refund, index) =>
            testQueryService.fetchEntryByExternalId(`${externalIdPrefix}-refund-${index}`)
        );

        expect(
            restoredDebitEntries.map(entry => ({ transactionId: entry.transactionId, originalTransactionId: entry.originalTransactionId }))
        ).toEqual(refunds.map(refund => ({ transactionId: refund.id, originalTransactionId: null })));
    });
});
