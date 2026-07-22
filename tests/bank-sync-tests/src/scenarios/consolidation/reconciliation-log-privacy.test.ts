import { bankSyncRepairService } from '@app/sync/service/bank-sync-repair.service';
import { bankSyncDuplicateSoftDeleteService } from '@app/sync/service/bank-sync-duplicate-soft-delete.service';
import { consolidationCoordinatorService } from '@app/sync/service/consolidation-coordinator.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isError, isObject } from '@rnw-community/shared';

import { ExternalSourceEnum, TransactionEntityTable, TransactionEntryEntityTable, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { insertOne } from '../../harness/db/insert-one';
import { seed, testDb } from '../../harness';

import type { ConsolidationScanScopeInterface, TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

vi.unmock('@app/sync/service/transfer-consolidation-drainer.service');

const reconciliationSentinel = 'app-reconciliation-error-sentinel';
const reconciliationPreviewSentinel = 'app-reconciliation-preview-error-sentinel';
const duplicateTransactionIdSentinel = '910000000002';
const duplicateErrorSentinel = 'bank-repair-duplicate-error-sentinel';
const reconciliationScope: ConsolidationScanScopeInterface = {
    operatedAtFrom: new Date('2026-06-07T08:09:10.000Z'),
    operatedAtTo: new Date('2026-06-08T09:10:11.000Z'),
    transactionIds: [710000000001, 720000000002]
};
const reconciliationScopeSentinels = ['710000000001', '720000000002', '2026-06-07T08:09:10.000Z', '2026-06-08T09:10:11.000Z'];
const capturedConsoleArguments: unknown[][] = [];

const seedPrivatbankDuplicate = (accountId: number, externalId: string) => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.INCOME,
        title: 'privacy duplicate',
        externalId,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: new Date('2026-06-09T10:11:12.000Z'),
        exchangeRate: 1,
        fromAccountId: null,
        toAccountId: accountId,
        comment: '',
        updatedBy: null,
        consolidationParentTransactionId: null,
        consolidationType: null
    } satisfies TransactionCreateEntityInterface);
    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount: 1_000_000,
        externalId,
        exchangeRate: 1,
        categoryId: null,
        mccCategoryId: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const serializeConsoleArgument = (value: unknown): string => {
    if (isError(value)) {
        return `${value.name}:${value.message}:${value.stack ?? ''}:${Object.values(Object.getOwnPropertyDescriptors(value))
            .map(descriptor => serializeConsoleArgument(descriptor.value))
            .join(':')}`;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map(serializeConsoleArgument).join(':');
    }

    if (isObject(value)) {
        return Object.entries(value)
            .map(([key, entry]) => `${key}:${serializeConsoleArgument(entry)}`)
            .join(':');
    }

    return String(value);
};

const captureConsoleArguments = (): void => {
    const captureArguments = (...arguments_: unknown[]): void => {
        capturedConsoleArguments.push(arguments_);
    };

    vi.spyOn(console, 'debug').mockImplementation(captureArguments);
    vi.spyOn(console, 'error').mockImplementation(captureArguments);
    vi.spyOn(console, 'log').mockImplementation(captureArguments);
};

const expectReconciliationConsoleArgumentsArePrivate = (): void => {
    const capturedOutput = capturedConsoleArguments.flatMap(arguments_ => arguments_.map(serializeConsoleArgument)).join('\n');

    expect(capturedConsoleArguments).not.toEqual([]);
    expect(capturedOutput).not.toContain(reconciliationSentinel);
    expect(capturedOutput).not.toContain(reconciliationPreviewSentinel);
    expect(capturedOutput).not.toContain(duplicateErrorSentinel);
    expect(capturedOutput).not.toContain(duplicateTransactionIdSentinel);
    for (const sentinel of reconciliationScopeSentinels) {
        expect(capturedOutput).not.toContain(sentinel);
    }
};

describe('consolidation/app-reconciliation-log-privacy', () => {
    afterEach(() => {
        transferConsolidationDrainerService.cancelPending();
        capturedConsoleArguments.length = 0;
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('keeps reconciliation scopes and errors private at production app boundaries', async () => {
        captureConsoleArguments();
        const reconciliationError = new Error(reconciliationSentinel);
        const coordinatorConsolidateSpy = vi.spyOn(consolidationCoordinatorService, 'consolidate').mockRejectedValue(reconciliationError);

        await expect(transferConsolidationService.consolidate(reconciliationScope)).rejects.toBe(reconciliationError);
        await expect(syncWorkloadService.run('transfer-consolidation-drain', () => Promise.reject(reconciliationError))).rejects.toBe(
            reconciliationError
        );

        const reconciliationPreviewError = new Error(reconciliationPreviewSentinel);
        const coordinatorCountAutoCandidatesSpy = vi
            .spyOn(consolidationCoordinatorService, 'countAutoCandidates')
            .mockRejectedValue(reconciliationPreviewError);
        await expect(transferConsolidationService.preview()).rejects.toBe(reconciliationPreviewError);
        await expect(transferConsolidationService.getProgressSnapshot()).rejects.toBe(reconciliationPreviewError);
        expect(coordinatorCountAutoCandidatesSpy).toHaveBeenCalledTimes(2);

        vi.useFakeTimers();
        Object.assign(transferConsolidationDrainerService, {
            cancelIdleCallback: null,
            hasPendingRun: false,
            isRunning: false,
            pendingScope: null,
            timer: null
        });
        transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, reconciliationScope);
        await vi.advanceTimersByTimeAsync(1500);
        await vi.runOnlyPendingTimersAsync();
        await Promise.resolve();
        expect(coordinatorConsolidateSpy).toHaveBeenCalledWith(reconciliationScope, undefined);

        const coordinatorCountSpy = vi
            .spyOn(consolidationCoordinatorService, 'countExistingTransferIncomeDuplicateRepairCandidates')
            .mockRejectedValue(reconciliationError);
        await expect(bankSyncRepairService.previewDuplicates()).rejects.toBe(reconciliationError);
        expect(coordinatorCountSpy).toHaveBeenCalledTimes(1);
        expectReconciliationConsoleArgumentsArePrivate();
    });

    it('keeps nested duplicate preview and removal logs private', async () => {
        captureConsoleArguments();
        const account = seed.account({ externalId: 'privacy-duplicate-account', externalSource: ExternalSourceEnum.PRIVATBANK });
        await testDb.$client.runAsync("INSERT INTO sqlite_sequence(name, seq) VALUES ('transactions', 910000000000)");
        const keptTransaction = seedPrivatbankDuplicate(account.id, 'privacy-duplicate-kept');
        const duplicateTransaction = seedPrivatbankDuplicate(account.id, 'privacy-duplicate-removed');

        const preview = await bankSyncRepairService.previewDuplicates();
        const result = await bankSyncRepairService.removeDuplicates();

        expect(preview.duplicateTransactionCount).toBe(1);
        expect(result.repairedTransactionCount).toBe(1);
        expect(duplicateTransaction.id).toBe(910000000002);
        expect(keptTransaction.deletedAt).toBeNull();

        const duplicateError = new Error(duplicateErrorSentinel);
        const getAllAsyncSpy = vi.spyOn(testDb.$client, 'getAllAsync').mockRejectedValue(duplicateError);
        await expect(bankSyncDuplicateSoftDeleteService.remove(testDb, [duplicateTransaction.id])).rejects.toBe(duplicateError);
        getAllAsyncSpy.mockRestore();
        expectReconciliationConsoleArgumentsArePrivate();
    });
});
