import { ruleApplicationDrainerService } from '@app/rule/service/rule-application-drainer.service';
import { ruleEngineService } from '@app/rule/service/rule-engine.service';
import { CategorySourceEnum, DbError, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../../harness';
import { flushScheduledDrain } from '../../harness/scheduler/flush-scheduled-drain';
import { useFakeDrainTimers } from '../../harness/scheduler/use-fake-drain-timers';
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
const appliedRulesToTransactions = vi.fn();

describe('rule/rule-application-drainer', () => {
    beforeEach(() => {
        useFakeDrainTimers();
        Object.assign(ruleApplicationDrainerService, {
            pendingRuleApplications: [],
            pendingTransactionIds: [],
            pendingTransactionInputs: []
        });
        appliedRulesToTransactions.mockClear();
        spyOnApplyRulesToTransactions().mockImplementation((transactionIds, transactionInputs) =>
            Effect.suspend(() => {
                appliedRulesToTransactions(transactionIds, transactionInputs);

                return Effect.void;
            })
        );
    });

    afterEach(async () => {
        await run(ruleApplicationDrainerService.cancelPending());
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits for active user import work before applying queued transaction rules', async () => {
        const importWork = new PausedUserWork(() => {
            void run(ruleApplicationDrainerService.enqueueTransactions([42], [buildTransactionInput()]));
        });

        await importWork.started;
        await flushScheduledDrain(drainDelayMs);
        expect(appliedRulesToTransactions).not.toHaveBeenCalled();

        importWork.release();
        await importWork.work;
        await flushScheduledDrain(drainDelayMs);

        expect(appliedRulesToTransactions).toHaveBeenCalledTimes(1);
        expect(appliedRulesToTransactions).toHaveBeenCalledWith([42], [buildTransactionInput()]);
    });

    it('reports the applied result to the enqueueing caller', async () => {
        const applyRule = vi
            .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
            .mockReturnValue(Effect.succeed({ applied: 3, failed: 0, total: 3 }));
        const onSettled = vi.fn();

        await run(ruleApplicationDrainerService.enqueueRuleApplication(7, onSettled));
        await flushScheduledDrain(drainDelayMs);

        expect(applyRule).toHaveBeenCalledWith(7, null);
        expect(onSettled).toHaveBeenCalledWith({ applied: 3, failed: 0, total: 3 }, null);
    });

    it('reports failures to the enqueueing caller and keeps draining', async () => {
        const error = new DbError({ cause: new Error('boom') });
        const applyRule = vi
            .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
            .mockReturnValueOnce(Effect.fail(error))
            .mockReturnValueOnce(Effect.succeed({ applied: 1, failed: 0, total: 1 }));
        const onSettled = vi.fn();

        await run(ruleApplicationDrainerService.enqueueRuleApplication(1, onSettled));
        await run(ruleApplicationDrainerService.enqueueRuleApplication(2, onSettled));
        await flushScheduledDrain(drainDelayMs);

        expect(applyRule).toHaveBeenCalledTimes(2);
        expect(onSettled).toHaveBeenNthCalledWith(1, null, error);
        expect(onSettled).toHaveBeenNthCalledWith(2, { applied: 1, failed: 0, total: 1 }, null);
    });

    it('does not enqueue the same rule twice', async () => {
        const applyRule = vi
            .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
            .mockReturnValue(Effect.succeed({ applied: 0, failed: 0, total: 0 }));
        const onSettled = vi.fn();

        await run(ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled));
        await run(ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled));
        await flushScheduledDrain(drainDelayMs);

        expect(applyRule).toHaveBeenCalledTimes(1);
        expect(onSettled).toHaveBeenCalledTimes(1);
    });
});
