import { consolidationScopeService } from '@budgie/consolidation';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { emptyFn, isError } from '@rnw-community/shared';

import {
    consolidationAutoCandidateService,
    consolidationCoordinatorService,
    consolidationRepairExecutorService,
    refundConsolidationService,
    refundPairRepository,
    testDb,
    testQueryService,
    testSeedService,
    transactionRepository,
    unconsolidationService
} from '../harness/test-context';

const reconciliationLogContexts = [
    'ConsolidationAutoCandidateService',
    'ConsolidationCandidateService',
    'ConsolidationCoordinatorService',
    'ConsolidationEligibilityService',
    'ConsolidationExecutorService',
    'ConsolidationMutationService',
    'ConsolidationRepairExecutorService',
    'ConsolidationScopeService',
    'RefundConsolidationService',
    'UnconsolidationService'
];

const reconciliationSentinels = [
    'Raw Merchant Sentinel',
    '424242000000',
    'external-id-sentinel',
    'DE89370400440532013000',
    'reference-sentinel',
    '810000000001',
    '820000000001',
    '830000000001',
    'executor-mutation-error-sentinel',
    'repair-error-sentinel',
    'refund-error-sentinel',
    '2026-06-07T08:09:10.000Z'
];

const capturedConsoleLines: string[] = [];

class OrdinaryLoggedService {
    @Log('enter', 'done', 'throw')
    fail(error: Error): never {
        throw error;
    }
}

const serializeConsoleArgument = (value: unknown): string => {
    if (isError(value)) {
        return `${value.name}\n${value.message}\n${value.stack ?? ''}\n${JSON.stringify(Object.getOwnPropertyDescriptors(value))}`;
    }

    return JSON.stringify(value) ?? String(value);
};

const captureConsoleLines = (): void => {
    const captureArguments = (...arguments_: unknown[]): void => {
        capturedConsoleLines.push(arguments_.map(serializeConsoleArgument).join('\n'));
    };

    vi.spyOn(console, 'debug').mockImplementation(captureArguments);
    vi.spyOn(console, 'error').mockImplementation(captureArguments);
    vi.spyOn(console, 'log').mockImplementation(captureArguments);
};

const expectReconciliationLogsArePrivate = (): void => {
    const capturedOutput = capturedConsoleLines.join('\n');

    expect(capturedConsoleLines).not.toEqual([]);
    for (const sentinel of reconciliationSentinels) {
        expect(capturedOutput).not.toContain(sentinel);
    }
};

const seedSensitiveIdentifiers = async (): Promise<void> => {
    await testDb.$client.runAsync("INSERT INTO sqlite_sequence(name, seq) VALUES ('accounts', 810000000000)");
    await testDb.$client.runAsync("INSERT INTO sqlite_sequence(name, seq) VALUES ('transactions', 820000000000)");
    await testDb.$client.runAsync("INSERT INTO sqlite_sequence(name, seq) VALUES ('transaction_entries', 830000000000)");
};

describe('consolidation/reconciliation-log-privacy', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        capturedConsoleLines.length = 0;
    });

    it('does not expose reconciliation data in successful lifecycle logs from every reconciliation service', async () => {
        captureConsoleLines();
        await seedSensitiveIdentifiers();

        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(424242 * PRECISION, transferMcc.id);
        const transferResult = await consolidationCoordinatorService.consolidate();
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
        const canonicalTransfer = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)[0];

        await expect(consolidationRepairExecutorService.consolidateRefund(refundCandidates[0])).resolves.toBe(true);
        await expect(refundConsolidationService.findRefundableExpenses(refunds[0].id, 'reference-sentinel')).resolves.toEqual([]);
        await expect(unconsolidationService.unconsolidateById(canonicalTransfer.id, testDb)).resolves.toBeUndefined();
        await expect(consolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates()).resolves.toBe(0);
        expect(
            consolidationScopeService.buildFromTransactions([{ id: 810000000001, operatedAt: new Date('2026-06-07T08:09:10.000Z') }])
        ).toEqual({
            operatedAtFrom: expect.any(Date),
            operatedAtTo: expect.any(Date),
            transactionIds: [810000000001]
        });
        for (const context of reconciliationLogContexts) {
            expect(capturedConsoleLines.join('\n')).toContain(`[${context}::`);
        }
        expectReconciliationLogsArePrivate();
    });

    it('does not expose thrown error payloads from every reconciliation service', async () => {
        captureConsoleLines();
        await seedSensitiveIdentifiers();

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
        expectReconciliationLogsArePrivate();
    });

    it('preserves raw error diagnostics for ordinary logs outside reconciliation', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(emptyFn);
        const ordinaryError = new Error('ordinary-error-diagnostic');

        expect(() => new OrdinaryLoggedService().fail(ordinaryError)).toThrow('ordinary-error-diagnostic');
        expect(consoleErrorSpy.mock.calls.some(arguments_ => arguments_.includes(ordinaryError))).toBe(true);
    });
});
