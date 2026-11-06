import { TransactionEmbeddingRepository } from '@budgie/categorization';
import { buildConsolidationScopeFromTransactions } from '@budgie/consolidation';
import { Db, SettingsRepository, SyncRecordTypeEnum, TransactionEntityTable } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { RuleEngineService } from '@budgie/rules';
import { TransferConsolidationService } from '@budgie/sync';
import { and, inArray, isNull } from 'drizzle-orm';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncAutomationEmbeddingBoost } from './sync-automation-embedding-boost.service';

import type { SyncAutomationResultInterface } from '../interface/sync-automation-result.interface';
import type { SyncApplyResultInterface } from '@budgie/contracts';

const TRANSACTIONS_TABLE = 'transactions';
const RECURRING_SERIES_TABLE = 'recurring_series';
const SYNC_ID_CHUNK_SIZE = 500;

export class SyncAutomationService extends Context.Service<SyncAutomationService>()('@budgie/app/SyncAutomationService', {
    make: Effect.gen(function* () {
        const transferConsolidationService = yield* TransferConsolidationService;
        const ruleEngine = yield* RuleEngineService;
        const recurringService = yield* RecurringService;
        const settingsRepository = yield* SettingsRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const embeddingBoost = yield* SyncAutomationEmbeddingBoost;

        const settle = <A, E>(effect: Effect.Effect<A, E, Db>, fallback: A) =>
            Effect.catchCause(effect, cause =>
                Cause.hasInterruptsOnly(cause) ? Effect.interrupt : Effect.as(Effect.logError(cause), fallback)
            );

        const findLiveTransactions = Effect.fnUntraced(function* (syncIds: readonly string[]) {
            const chunks: string[][] = [];

            for (let start = 0; start < syncIds.length; start += SYNC_ID_CHUNK_SIZE) {
                chunks.push(syncIds.slice(start, start + SYNC_ID_CHUNK_SIZE));
            }

            const rows = yield* Effect.forEach(chunks, chunk =>
                Db.query(db =>
                    db
                        .select({ id: TransactionEntityTable.id, operatedAt: TransactionEntityTable.operatedAt })
                        .from(TransactionEntityTable)
                        .where(and(inArray(TransactionEntityTable.syncId, chunk), isNull(TransactionEntityTable.deletedAt)))
                )
            );

            return rows.flat();
        });

        const consolidate = Effect.fnUntraced(function* (syncIds: readonly string[]) {
            const scope = buildConsolidationScopeFromTransactions(yield* findLiveTransactions(syncIds));

            return isDefined(scope) ? (yield* transferConsolidationService.consolidate(scope)).consolidated : 0;
        });

        return {
            afterApply: Effect.fn('SyncAutomationService.afterApply')(function* (result: SyncApplyResultInterface) {
                const touchedSyncIds = result.touchedRows[TRANSACTIONS_TABLE] ?? [];
                const hasDeletedTransactions = isNotEmptyArray(result.deleted[SyncRecordTypeEnum.TRANSACTION] ?? []);
                const hasSeriesChange = isNotEmptyArray(result.touchedRows[RECURRING_SERIES_TABLE] ?? []) || isNotEmptyArray(result.merged);
                const consolidated = yield* settle(consolidate(touchedSyncIds), 0);
                const survivorIds = (yield* findLiveTransactions(touchedSyncIds)).map(({ id }) => id);

                yield* settle(ruleEngine.applyCreateSafeRulesToTransactionIds(survivorIds), undefined);

                const settings = yield* settingsRepository.find;
                const isAiSuggestionsEnabled = isDefined(settings) && settings.isAiSuggestionsEnabled;
                const embeddingQueuedCount = isAiSuggestionsEnabled ? survivorIds.length : 0;

                if (isNotEmptyArray(survivorIds) && isAiSuggestionsEnabled) {
                    yield* settle(transactionEmbeddingRepository.markForEmbeddingByIds(survivorIds), undefined);
                    yield* Effect.forkDetach(Effect.ignoreCause(embeddingBoost));
                }

                const isRecurringDetected = isNotEmptyArray(survivorIds) || hasDeletedTransactions || hasSeriesChange;

                if (isRecurringDetected) {
                    yield* settle(
                        Effect.flatMap(Clock.currentTimeMillis, now => recurringService.detect(new Date(now))),
                        undefined
                    );
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
            SettingsRepository.layer,
            TransactionEmbeddingRepository.layer
        ])
    );
}
