import { RuleApplicationDrainerService } from '@app/rule/service/rule-application-drainer.service';
import { RuleEngineService } from '@app/rule/service/rule-engine.service';
import { CategorySourceEnum, DbError, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

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

const arrange = Effect.gen(function* () {
    const ruleEngineService = yield* RuleEngineService;
    const appliedRulesToTransactions = vi.fn();

    vi.spyOn(ruleEngineService, 'applyRulesToTransactions').mockImplementation((transactionIds, transactionInputs) =>
        Effect.suspend(() => {
            appliedRulesToTransactions(transactionIds, transactionInputs);

            return Effect.void;
        })
    );

    return {
        appliedRulesToTransactions,
        applyRule: vi.spyOn(ruleEngineService, 'applyRuleToMatchingTransactions'),
        onSettled: vi.fn()
    };
});

describe('rule/rule-application-drainer', () => {
    it.effect('waits for active user import work before applying queued transaction rules', () =>
        Effect.gen(function* () {
            const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
            const { appliedRulesToTransactions } = yield* arrange;
            const releaseImportWork = yield* pauseUserWork(
                ruleApplicationDrainerService.enqueueTransactions([42], [buildTransactionInput()])
            );

            yield* advanceScheduledDrain(drainDelayMs);
            expect(appliedRulesToTransactions).not.toHaveBeenCalled();

            yield* releaseImportWork();
            yield* advanceScheduledDrain(drainDelayMs);

            expect(appliedRulesToTransactions).toHaveBeenCalledTimes(1);
            expect(appliedRulesToTransactions).toHaveBeenCalledWith([42], [buildTransactionInput()]);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('reports the applied result to the enqueueing caller', () =>
        Effect.gen(function* () {
            const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
            const { applyRule, onSettled } = yield* arrange;
            applyRule.mockReturnValue(Effect.succeed({ applied: 3, failed: 0, total: 3 }));

            yield* ruleApplicationDrainerService.enqueueRuleApplication(7, onSettled);
            yield* advanceScheduledDrain(drainDelayMs);

            expect(applyRule).toHaveBeenCalledWith(7, null);
            expect(onSettled).toHaveBeenCalledWith({ applied: 3, failed: 0, total: 3 }, null);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('reports failures to the enqueueing caller and keeps draining', () =>
        Effect.gen(function* () {
            const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
            const { applyRule, onSettled } = yield* arrange;
            const error = new DbError({ cause: new Error('boom') });
            applyRule.mockReturnValueOnce(Effect.fail(error)).mockReturnValueOnce(Effect.succeed({ applied: 1, failed: 0, total: 1 }));

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
            const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
            const { applyRule, onSettled } = yield* arrange;
            applyRule.mockReturnValue(Effect.succeed({ applied: 0, failed: 0, total: 0 }));

            yield* ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled);
            yield* ruleApplicationDrainerService.enqueueRuleApplication(5, onSettled);
            yield* advanceScheduledDrain(drainDelayMs);

            expect(applyRule).toHaveBeenCalledTimes(1);
            expect(onSettled).toHaveBeenCalledTimes(1);
        }).pipe(Effect.provide(TestClockLayer))
    );
});
