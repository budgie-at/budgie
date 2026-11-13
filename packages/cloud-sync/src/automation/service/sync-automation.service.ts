import { TransactionEmbeddingRepository } from '@budgie/categorization';
import { buildConsolidationScopeFromTransactions } from '@budgie/consolidation';
import { Db, SettingsRepository, SyncRecordTypeEnum, TransactionRepository } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { MarketPricedRevaluationService } from '@budgie/market';
import { RecurringService } from '@budgie/recurring';
import { RuleEngineService } from '@budgie/rules';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncAutomationEmbeddingBoost } from '../port/sync-automation-embedding-boost.port';

import type { SyncApplyResultInterface } from '../../apply/interface/sync-apply-result.interface';
import type { SyncAutomationResultInterface } from '../interface/sync-automation-result.interface';

const TRANSACTIONS_TABLE = 'transactions';
const RECURRING_SERIES_TABLE = 'recurring_series';

export class SyncAutomationService extends Context.Service<SyncAutomationService>()('@budgie/cloud-sync/SyncAutomationService', {
    make: Effect.gen(function* () {
        const transferConsolidationService = yield* TransferConsolidationService;
        const ruleEngine = yield* RuleEngineService;
        const recurringService = yield* RecurringService;
        const settingsRepository = yield* SettingsRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const embeddingBoost = yield* SyncAutomationEmbeddingBoost;
        const transactionRepository = yield* TransactionRepository;
        const marketPricedRevaluationService = yield* MarketPricedRevaluationService;

        const settle = <A, E>(effect: Effect.Effect<A, E, Db>, fallback: A) =>
            Effect.catchCause(effect, cause =>
                Cause.hasInterruptsOnly(cause) ? Effect.interrupt : Effect.as(Effect.logError(cause), fallback)
            );

        const settleVoid = <A, E>(effect: Effect.Effect<A, E, Db>) => settle(Effect.asVoid(effect), void 0);

        const consolidate = Effect.fnUntraced(function* (syncIds: readonly string[]) {
            const transactions = yield* transactionRepository.findLiveIdsBySyncIds(syncIds);
            const scope = buildConsolidationScopeFromTransactions(transactions);

            return isDefined(scope) ? (yield* transferConsolidationService.consolidate(scope)).consolidated : 0;
        });

        return {
            afterApply: Effect.fn('SyncAutomationService.afterApply')(function* (result: SyncApplyResultInterface) {
                const touchedSyncIds = result.touchedRows[TRANSACTIONS_TABLE] ?? [];

                yield* settleVoid(marketPricedRevaluationService.revalueTransactions(touchedSyncIds));

                const hasDeletedTransactions = isNotEmptyArray(result.deleted[SyncRecordTypeEnum.TRANSACTION] ?? []);
                const hasSeriesChange = isNotEmptyArray(result.touchedRows[RECURRING_SERIES_TABLE] ?? []) || isNotEmptyArray(result.merged);
                const consolidated = yield* settle(consolidate(touchedSyncIds), 0);
                const survivorIds = (yield* transactionRepository.findLiveIdsBySyncIds(touchedSyncIds)).map(({ id }) => id);

                yield* settleVoid(ruleEngine.applyCreateSafeRulesToTransactionIds(survivorIds));

                const settings = yield* settingsRepository.find;
                const isAiSuggestionsEnabled = isDefined(settings) && settings.isAiSuggestionsEnabled;
                const embeddingQueuedCount = isAiSuggestionsEnabled ? survivorIds.length : 0;

                if (isNotEmptyArray(survivorIds) && isAiSuggestionsEnabled) {
                    yield* settleVoid(transactionEmbeddingRepository.markForEmbeddingByIds(survivorIds));
                    yield* embeddingBoost.pipe(Effect.ignoreCause, Effect.forkDetach);
                }

                const isRecurringDetected = isNotEmptyArray(survivorIds) || hasDeletedTransactions || hasSeriesChange;

                if (isRecurringDetected) {
                    yield* settleVoid(Effect.flatMap(Clock.currentTimeMillis, now => recurringService.detect(new Date(now))));
                }

                return {
                    consolidated,
                    ruleTransactionCount: survivorIds.length,
                    embeddingQueuedCount,
                    isRecurringDetected
                } satisfies SyncAutomationResultInterface;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncAutomationService, SyncAutomationService.make).pipe(
        Layer.provide([
            TransferConsolidationService.layer,
            RuleEngineService.layer,
            RecurringService.layer,
            MarketPricedRevaluationService.layer,
            SettingsRepository.layer,
            TransactionRepository.layer,
            TransactionEmbeddingRepository.layer
        ])
    );
}
