import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

import { ruleEngineService } from './rule-engine.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { PendingRuleApplicationInterface } from '../interface/pending-rule-application.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

class RuleApplicationDrainerService {
    private static readonly DRAIN_KEY = 'rule-application-drain';
    private static readonly DRAIN_DELAY_MS = 250;

    readonly enqueueTransactions = Effect.fn('RuleApplicationDrainerService.enqueueTransactions')(function* (
        this: RuleApplicationDrainerService,
        transactionIds: number[],
        transactionInputs: TransactionCreateInputInterface[]
    ) {
        if (!isNotEmptyArray(transactionIds) || !isNotEmptyArray(transactionInputs)) {
            return;
        }

        this.pendingTransactionIds.push(...transactionIds);
        this.pendingTransactionInputs.push(...transactionInputs);
        yield* this.scheduleDrain();
    });

    readonly enqueueRuleApplication = Effect.fn('RuleApplicationDrainerService.enqueueRuleApplication')(function* (
        this: RuleApplicationDrainerService,
        ruleId: number,
        onSettled?: (result: ApplyRuleResultInterface | null, error: unknown) => void
    ) {
        if (this.pendingRuleApplications.some(pending => pending.ruleId === ruleId)) {
            return;
        }

        this.pendingRuleApplications.push({ ruleId, onSettled });
        yield* this.scheduleDrain();
    });

    readonly cancelPending = Effect.fn('RuleApplicationDrainerService.cancelPending')(function* (this: RuleApplicationDrainerService) {
        this.pendingRuleApplications = [];
        this.pendingTransactionIds = [];
        this.pendingTransactionInputs = [];
        const workload = yield* Workload;
        yield* workload.cancelScheduled(RuleApplicationDrainerService.DRAIN_KEY);
    });

    private readonly drain = Effect.fn('RuleApplicationDrainerService.drain')(function* (this: RuleApplicationDrainerService) {
        yield* Effect.sleep(RuleApplicationDrainerService.DRAIN_DELAY_MS);
        yield* waitForIdle;

        while (isNotEmptyArray(this.pendingTransactionIds) || isNotEmptyArray(this.pendingRuleApplications)) {
            yield* this.processPendingTransactionBatch();
            yield* this.processPendingRuleBatch();
        }
    });

    private readonly processPendingTransactionBatch = Effect.fn('RuleApplicationDrainerService.processPendingTransactionBatch')(
        function* (this: RuleApplicationDrainerService) {
            if (!isNotEmptyArray(this.pendingTransactionIds)) {
                return;
            }

            const transactionIds = this.pendingTransactionIds;
            const transactionInputs = this.pendingTransactionInputs;

            this.pendingTransactionIds = [];
            this.pendingTransactionInputs = [];

            const workload = yield* Workload;
            yield* workload.run(ruleEngineService.applyRulesToTransactions(transactionIds, transactionInputs)).pipe(
                Effect.tapCause(cause =>
                    Effect.logError('processPendingTransactionBatch:throw', {
                        queuedTransactionIds: transactionIds.join(','),
                        queuedInputCount: transactionInputs.length,
                        errorMessage: getErrorMessage(Cause.squash(cause))
                    })
                ),
                Effect.ignoreCause
            );
            yield* YIELD_TO_UI;
        }
    );

    private readonly processPendingRuleBatch = Effect.fn('RuleApplicationDrainerService.processPendingRuleBatch')(
        function* (this: RuleApplicationDrainerService) {
            const pending = this.pendingRuleApplications.shift();

            if (!isDefined(pending)) {
                return;
            }

            const { ruleId, onSettled } = pending;
            const workload = yield* Workload;

            yield* workload.run(ruleEngineService.applyRuleToMatchingTransactions(ruleId, null)).pipe(
                Effect.matchCause({
                    onSuccess: result => {
                        onSettled?.(result, null);
                    },
                    onFailure: cause => {
                        onSettled?.(null, Cause.squash(cause));
                    }
                })
            );
            yield* YIELD_TO_UI;
        }
    );

    private readonly scheduleDrain = Effect.fn('RuleApplicationDrainerService.scheduleDrain')(
        function* (this: RuleApplicationDrainerService) {
            const workload = yield* Workload;
            yield* workload.schedule(RuleApplicationDrainerService.DRAIN_KEY, this.drain());
        }
    );

    private pendingRuleApplications: PendingRuleApplicationInterface[] = [];
    private pendingTransactionIds: number[] = [];
    private pendingTransactionInputs: TransactionCreateInputInterface[] = [];
}

export const ruleApplicationDrainerService = new RuleApplicationDrainerService();
