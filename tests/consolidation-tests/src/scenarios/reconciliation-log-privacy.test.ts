import { PRECISION } from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { refundConsolidationService, testSeedService, transactionRepository } from '../harness/test-context';

const reconciliationSentinels = [
    'Raw Merchant Sentinel',
    '424242000000',
    'external-id-sentinel',
    'DE89370400440532013000',
    'reference-sentinel',
    'raw-error-sentinel'
];

const capturedLogLines: string[] = [];

const captureReconciliationLogLines = (): void => {
    vi.spyOn(console, 'debug').mockImplementation((...arguments_) => {
        capturedLogLines.push(arguments_.join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...arguments_) => {
        capturedLogLines.push(arguments_.slice(0, 2).join(' '));
    });
    vi.spyOn(console, 'log').mockImplementation((...arguments_) => {
        capturedLogLines.push(arguments_.join(' '));
    });
};

describe('consolidation/reconciliation-log-privacy', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        capturedLogLines.length = 0;
    });

    it('does not expose reconciliation data in successful or thrown lifecycle logs', async () => {
        captureReconciliationLogLines();

        const account = testSeedService.account({ externalId: 'external-id-sentinel' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 424242 * PRECISION,
            refundAmounts: [42 * PRECISION],
            refundTitle: 'Raw Merchant Sentinel',
            title: 'reference-sentinel DE89370400440532013000'
        });

        await refundConsolidationService.convertToRefund({
            refundIncomeTransactionId: refunds[0].id,
            expenseTransactionId: expense.id
        });
        await refundConsolidationService.findRefundableExpenses(-1, 'raw-error-sentinel');
        vi.spyOn(transactionRepository, 'findByIds').mockRejectedValue(new Error('raw-error-sentinel'));

        await expect(
            refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: refunds[0].id,
                expenseTransactionId: expense.id
            })
        ).rejects.toThrow('raw-error-sentinel');

        expect(capturedLogLines).not.toEqual([]);
        expect(capturedLogLines.join('\n')).not.toContain(reconciliationSentinels[0]);
        expect(capturedLogLines.join('\n')).not.toContain(reconciliationSentinels[1]);
        expect(capturedLogLines.join('\n')).not.toContain(reconciliationSentinels[2]);
        expect(capturedLogLines.join('\n')).not.toContain(reconciliationSentinels[3]);
        expect(capturedLogLines.join('\n')).not.toContain(reconciliationSentinels[4]);
        expect(capturedLogLines.join('\n')).not.toContain(reconciliationSentinels[5]);
    });
});
