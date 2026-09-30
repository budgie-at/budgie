import { ruleApplicationDrainerService } from '@app/rule/service/rule-application-drainer.service';
import { ruleEngineService } from '@app/rule/service/rule-engine.service';
import { CategorySourceEnum, DbError, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestClockLayer } from '../../harness';
import { advanceScheduledDrain } from '../../harness/scheduler/advance-scheduled-drain';
import { pauseUserWork } from '../../harness/sync-workload/pause-user-work';

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

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('waits for active user import work before applying queued transaction rules', () =>
        Effect.gen(function* () {
            const releaseImportWork = yield* pauseUserWork(
                ruleApplicationDrainerService.enqueueTransactions([42], [buildTransactionInput()])
            );

            yield* advanceScheduledDrain(drainDelayMs);
            expect(appliedRulesToTransactions).not.toHaveBeenCalled();

            yield* releaseImportWork;
            yield* advanceScheduledDrain(drainDelayMs);

            expect(appliedRulesToTransactions).toHaveBeenCalledTimes(1);
            expect(appliedRulesToTransactions).toHaveBeenCalledWith([42], [buildTransactionInput()]);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('reports the applied result to the enqueueing caller', () =>
        Effect.gen(function* () {
            const applyRule = vi
                .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
                .mockReturnValue(Effect.succeed({ applied: 3, failed: 0, total: 3 }));
            const onSettled = vi.fn();

            yield* ruleApplicationDrainerService.enqueueRuleApplication(7, onSettled);
            yield* advanceScheduledDrain(drainDelayMs);

            expect(applyRule).toHaveBeenCalledWith(7, null);
            expect(onSettled).toHaveBeenCalledWith({ applied: 3, failed: 0, total: 3 }, null);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('reports failures to the enqueueing caller and keeps draining', () =>
        Effect.gen(function* () {
            const error = new DbError({ cause: new Error('boom') });
            const applyRule = vi
                .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
                .mockReturnValueOnce(Effect.fail(error))
                .mockReturnValueOnce(Effect.succeed({ applied: 1, failed: 0, total: 1 }));
            const onSettled = vi.fn();

            yield* ruleApplicationDrainerService.enqueueRuleApplication(1, onSettled);
            yield* ruleApplicationDrainerService.enqueueRuleApplication(2, onSettled);
            yield* advanceScheduledDrain(drainDelayMs);

            expect(applyRule).toHaveBeenCalledTimes(2);
            expect(onSettled).toHaveBeenNthCalledWith(1, null, error);
            expect(onSettled).toHaveBeenNthCalledWith(2, { applied: 1, failed: 0, total: 1 }, null);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('does not enqueue the same rule twice', () =>
        Effect.gen(function* () {
            const applyRule = vi
                .spyOn(ruleEngineService, 'applyRuleToMatchingTransactions')
                .mockReturnValue(Effect.succeed({ applied: 0, failed: 0, total: 0 }));
            const onSettled = vi.fn();

            yield* ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled);
            yield* ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled);
            yield* advanceScheduledDrain(drainDelayMs);

            expect(applyRule).toHaveBeenCalledTimes(1);
            expect(onSettled).toHaveBeenCalledTimes(1);
        }).pipe(Effect.provide(TestClockLayer))
    );
});
