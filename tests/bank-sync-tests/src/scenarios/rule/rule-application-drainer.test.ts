import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { emptyFn } from '@rnw-community/shared';

import { ruleApplicationDrainerService } from '@app/rule/service/rule-application-drainer.service';
import { ruleEngineService } from '@app/rule/service/rule-engine.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const drainDelayMs = 250;
const immediateTimerMs = 0;

const buildTransactionInput = (): TransactionCreateInputInterface => ({
    amount: 10,
    comment: '',
    entries: [
        {
            accountId: 1,
            amount: 10_000_000,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            exchangeRate: 1,
            externalId: 'privat-import-rule-drain',
            mccCategoryId: null,
            toIban: null,
            type: TransactionEntryTypeEnum.CREDIT
        }
    ],
    exchangeRate: 1,
    externalId: 'privat-import-rule-drain',
    externalSource: ExternalSourceEnum.PRIVATBANK,
    fromAccountId: 1,
    operatedAt: new Date('2026-06-13T02:38:14.000Z'),
    tagIds: [],
    title: 'Privat import rule drain',
    toAccountId: null,
    type: TransactionTypeEnum.EXPENSE,
    updatedBy: null
});

const flushScheduledDrain = async (): Promise<void> => {
    await vi.advanceTimersByTimeAsync(drainDelayMs);
    await vi.advanceTimersByTimeAsync(immediateTimerMs);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
};

describe('rule/rule-application-drainer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
        Object.assign(syncWorkloadService, {
            backgroundQueue: [],
            isAcceptingWork: true,
            isRunning: false,
            queuedUserWorkListeners: new Set(),
            userQueue: []
        });
        Object.assign(ruleApplicationDrainerService, {
            cancelIdleCallback: null,
            isRunning: false,
            pendingRuleIds: [],
            pendingTransactionIds: [],
            pendingTransactionInputs: [],
            runPromise: null,
            timer: null
        });
        vi.spyOn(ruleEngineService, 'applyRulesToTransactions').mockResolvedValue(undefined);
    });

    afterEach(() => {
        ruleApplicationDrainerService.cancelPending();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits for active user import work before applying queued transaction rules', async () => {
        let releaseImport = emptyFn;
        const importRelease = new Promise<void>(resolve => {
            releaseImport = resolve;
        });
        let markImportStarted = emptyFn;
        const importStarted = new Promise<void>(resolve => {
            markImportStarted = resolve;
        });
        const importWork = syncWorkloadService.runUser('file-import', async () => {
            ruleApplicationDrainerService.enqueueTransactions([42], [buildTransactionInput()]);
            markImportStarted();
            await importRelease;
        });

        await importStarted;
        await flushScheduledDrain();
        expect(ruleEngineService.applyRulesToTransactions).not.toHaveBeenCalled();

        releaseImport();
        await importWork;
        await flushScheduledDrain();

        expect(ruleEngineService.applyRulesToTransactions).toHaveBeenCalledTimes(1);
        expect(ruleEngineService.applyRulesToTransactions).toHaveBeenCalledWith([42], [buildTransactionInput()]);
    });
});
