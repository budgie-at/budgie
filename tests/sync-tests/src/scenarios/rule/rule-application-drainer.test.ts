import { ruleApplicationDrainerService } from '@app/rule/service/rule-application-drainer.service';
import { ruleEngineService } from '@app/rule/service/rule-engine.service';
import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flushScheduledDrain } from '../../harness/scheduler/flush-scheduled-drain';
import { PausedUserWork } from '../../harness/sync-workload/paused-user-work';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const drainDelayMs = 250;

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

const spyOnApplyRulesToTransactions = () => vi.spyOn(ruleEngineService, 'applyRulesToTransactions');

describe('rule/rule-application-drainer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
        Object.assign(ruleApplicationDrainerService, {
            cancelIdleCallback: null,
            isRunning: false,
            pendingRuleApplications: [],
            pendingTransactionIds: [],
            pendingTransactionInputs: [],
            runPromise: null,
            timer: null
        });
        spyOnApplyRulesToTransactions().mockResolvedValue();
    });

    afterEach(() => {
        ruleApplicationDrainerService.cancelPending();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits for active user import work before applying queued transaction rules', async () => {
        const importWork = new PausedUserWork('file-import', () => {
            ruleApplicationDrainerService.enqueueTransactions([42], [buildTransactionInput()]);
        });

        await importWork.started;
        await flushScheduledDrain(drainDelayMs);
        expect(spyOnApplyRulesToTransactions()).not.toHaveBeenCalled();

        importWork.release();
        await importWork.work;
        await flushScheduledDrain(drainDelayMs);

        expect(spyOnApplyRulesToTransactions()).toHaveBeenCalledTimes(1);
        expect(spyOnApplyRulesToTransactions()).toHaveBeenCalledWith([42], [buildTransactionInput()]);
    });

    it('reports the applied result to the enqueueing caller', async () => {
        const applyRule = vi
            .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
            .mockResolvedValue({ applied: 3, failed: 0, total: 3 });
        const onSettled = vi.fn();

        ruleApplicationDrainerService.enqueueRuleApplication(7, onSettled);
        await flushScheduledDrain(drainDelayMs);

        expect(applyRule).toHaveBeenCalledWith(7, null);
        expect(onSettled).toHaveBeenCalledWith({ applied: 3, failed: 0, total: 3 }, null);
    });

    it('reports failures to the enqueueing caller and keeps draining', async () => {
        const error = new Error('boom');
        const applyRule = vi
            .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({ applied: 1, failed: 0, total: 1 });
        const onSettled = vi.fn();

        ruleApplicationDrainerService.enqueueRuleApplication(1, onSettled);
        ruleApplicationDrainerService.enqueueRuleApplication(2, onSettled);
        await flushScheduledDrain(drainDelayMs);

        expect(applyRule).toHaveBeenCalledTimes(2);
        expect(onSettled).toHaveBeenNthCalledWith(1, null, error);
        expect(onSettled).toHaveBeenNthCalledWith(2, { applied: 1, failed: 0, total: 1 }, null);
    });

    it('does not enqueue the same rule twice', async () => {
        const applyRule = vi
            .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
            .mockResolvedValue({ applied: 0, failed: 0, total: 0 });
        const onSettled = vi.fn();

        ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled);
        ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled);
        await flushScheduledDrain(drainDelayMs);

        expect(applyRule).toHaveBeenCalledTimes(1);
        expect(onSettled).toHaveBeenCalledTimes(1);
    });
});
