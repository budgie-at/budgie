import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

import { RuleEngineService } from './rule-engine.service';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';
import type { PendingRuleApplicationInterface } from '../interface/pending-rule-application.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class RuleApplicationDrainerService extends Context.Service<RuleApplicationDrainerService>()(
    '@budgie/app/RuleApplicationDrainerService',
    {
        make: Effect.gen(function* () {
            const workload = yield* Workload;
            const ruleEngineService = yield* RuleEngineService;
            const drainKey = 'rule-application-drain';
            const drainDelayMs = 250;
            const pendingRuleApplications: PendingRuleApplicationInterface[] = [];
            const pendingTransactionIds: number[] = [];
            const pendingTransactionInputs: TransactionCreateInputInterface[] = [];

            const processPendingTransactionBatch = Effect.fn('RuleApplicationDrainerService.processPendingTransactionBatch')(function* () {
                if (!isNotEmptyArray(pendingTransactionIds)) {
                    return;
                }

                const transactionIds = pendingTransactionIds.splice(0);
                const transactionInputs = pendingTransactionInputs.splice(0);

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
            });

            const processPendingRuleBatch = Effect.fn('RuleApplicationDrainerService.processPendingRuleBatch')(function* () {
                const pending = pendingRuleApplications.shift();

                if (!isDefined(pending)) {
                    return;
                }

                const { ruleId, onSettled } = pending;

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
            });

            const drain = Effect.fn('RuleApplicationDrainerService.drain')(function* () {
                yield* Effect.sleep(drainDelayMs);
                yield* waitForIdle;

                while (isNotEmptyArray(pendingTransactionIds) || isNotEmptyArray(pendingRuleApplications)) {
                    yield* processPendingTransactionBatch();
                    yield* processPendingRuleBatch();
                }
            });

            const scheduleDrain = Effect.fn('RuleApplicationDrainerService.scheduleDrain')(function* () {
                yield* workload.schedule(drainKey, drain());
            });

            return {
                enqueueTransactions: Effect.fn('RuleApplicationDrainerService.enqueueTransactions')(function* (
                    transactionIds: number[],
                    transactionInputs: TransactionCreateInputInterface[]
                ) {
                    if (!isNotEmptyArray(transactionIds) || !isNotEmptyArray(transactionInputs)) {
                        return;
                    }

                    pendingTransactionIds.push(...transactionIds);
                    pendingTransactionInputs.push(...transactionInputs);
                    yield* scheduleDrain();
                }),
                enqueueRuleApplication: Effect.fn('RuleApplicationDrainerService.enqueueRuleApplication')(function* (
                    ruleId: number,
                    onSettled?: (result: ApplyRuleResultInterface | null, error: unknown) => void
                ) {
                    if (pendingRuleApplications.some(pending => pending.ruleId === ruleId)) {
                        return;
                    }

                    pendingRuleApplications.push({ ruleId, onSettled });
                    yield* scheduleDrain();
                }),
                cancelPending: Effect.fn('RuleApplicationDrainerService.cancelPending')(function* () {
                    pendingRuleApplications.splice(0);
                    pendingTransactionIds.splice(0);
                    pendingTransactionInputs.splice(0);
                    yield* workload.cancelScheduled(drainKey);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(RuleApplicationDrainerService, RuleApplicationDrainerService.make).pipe(
        Layer.provide([Workload.layer, RuleEngineService.layer])
    );
}
