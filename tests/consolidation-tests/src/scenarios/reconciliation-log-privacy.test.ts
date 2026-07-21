import { PRECISION } from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isError } from '@rnw-community/shared';

import {
    consolidationAutoCandidateService,
    consolidationRepairExecutorService,
    refundConsolidationService,
    refundPairRepository,
    testQueryService,
    testSeedService,
    transactionRepository
} from '../harness/test-context';

const reconciliationLogContexts = [
    'ConsolidationExecutorService',
    'ConsolidationMutationService',
    'ConsolidationRepairExecutorService',
    'RefundConsolidationService'
];

const reconciliationSentinels = [
    'Raw Merchant Sentinel',
    '424242000000',
    'external-id-sentinel',
    'DE89370400440532013000',
    'reference-sentinel',
    'executor-mutation-error-sentinel',
    'repair-error-sentinel',
    'refund-error-sentinel'
];

const capturedReconciliationLogLines: string[] = [];

const serializeConsoleArgument = (value: unknown): string => {
    if (isError(value)) {
        return `${value.name}\n${value.message}\n${value.stack ?? ''}\n${JSON.stringify(Object.getOwnPropertyDescriptors(value))}`;
    }

    return JSON.stringify(value) ?? String(value);
};

const captureReconciliationLogLines = (): void => {
    const captureArguments = (...arguments_: unknown[]): void => {
        const serializedArguments = arguments_.map(serializeConsoleArgument).join('\n');

        if (reconciliationLogContexts.some(context => serializedArguments.includes(`[${context}::`))) {
            capturedReconciliationLogLines.push(serializedArguments);
        }
    };

    vi.spyOn(console, 'debug').mockImplementation(captureArguments);
    vi.spyOn(console, 'error').mockImplementation(captureArguments);
    vi.spyOn(console, 'log').mockImplementation(captureArguments);
};

const expectReconciliationLogsArePrivate = (): void => {
    const capturedOutput = capturedReconciliationLogLines.join('\n');

    expect(capturedReconciliationLogLines).not.toEqual([]);
    for (const context of reconciliationLogContexts) {
        expect(capturedOutput).toContain(`[${context}::`);
    }
    for (const sentinel of reconciliationSentinels) {
        expect(capturedOutput).not.toContain(sentinel);
    }
};

describe('consolidation/reconciliation-log-privacy', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        capturedReconciliationLogLines.length = 0;
    });

    it('does not expose reconciliation data in successful lifecycle logs from every reconciliation service', async () => {
        captureReconciliationLogLines();

        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(424242 * PRECISION, transferMcc.id);
        const transferResult = await consolidationAutoCandidateService.process();
        const account = testSeedService.account({ externalId: 'external-id-sentinel', iban: 'DE89370400440532013000' });
        const { refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 424242 * PRECISION,
            externalIdPrefix: 'reference-sentinel',
            refundAmounts: [42 * PRECISION],
            refundTitle: 'Raw Merchant Sentinel reference-sentinel DE89370400440532013000',
            title: 'Raw Merchant Sentinel reference-sentinel DE89370400440532013000'
        });
        const refundCandidates = await refundPairRepository.findCandidates();

        expect(transferResult.consolidated).toBe(1);
        await expect(consolidationRepairExecutorService.consolidateRefund(refundCandidates[0])).resolves.toBe(true);
        await expect(refundConsolidationService.findRefundableExpenses(refunds[0].id, 'reference-sentinel')).resolves.toEqual([]);
        expectReconciliationLogsArePrivate();
    });

    it('does not expose thrown error payloads from every reconciliation service', async () => {
        captureReconciliationLogLines();

        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(424242 * PRECISION, transferMcc.id);
        const executorMutationError = new Error('executor-mutation-error-sentinel');
        const createTransactionSpy = vi.spyOn(transactionRepository, 'create').mockRejectedValue(executorMutationError);

        await expect(consolidationAutoCandidateService.process()).rejects.toThrow('executor-mutation-error-sentinel');
        createTransactionSpy.mockRestore();

        const account = testSeedService.account({ externalId: 'external-id-sentinel', iban: 'DE89370400440532013000' });
        testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 424242 * PRECISION,
            externalIdPrefix: 'reference-sentinel',
            refundAmounts: [42 * PRECISION],
            refundTitle: 'Raw Merchant Sentinel reference-sentinel DE89370400440532013000',
            title: 'Raw Merchant Sentinel reference-sentinel DE89370400440532013000'
        });
        const refundCandidates = await refundPairRepository.findCandidates();
        const setConsolidationTypeSpy = vi
            .spyOn(transactionRepository, 'setConsolidationType')
            .mockRejectedValue(new Error('repair-error-sentinel'));

        await expect(consolidationRepairExecutorService.consolidateRefund(refundCandidates[0])).rejects.toThrow('repair-error-sentinel');
        setConsolidationTypeSpy.mockRestore();

        vi.spyOn(refundPairRepository, 'findRefundableExpenseCandidates').mockRejectedValue(new Error('refund-error-sentinel'));

        await expect(refundConsolidationService.findRefundableExpenses(-1, 'reference-sentinel')).rejects.toThrow('refund-error-sentinel');
        expect(vi.mocked(console.error).mock.calls.some(arguments_ => arguments_.includes(executorMutationError))).toBe(true);
        expectReconciliationLogsArePrivate();
    });
});
