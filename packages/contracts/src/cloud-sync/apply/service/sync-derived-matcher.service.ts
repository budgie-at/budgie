import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../../@generic/service/db.service';
import { RecurringSeriesUserStateEnum } from '../../../recurring-series/enum/recurring-series-user-state.enum';

import type { SyncDerivedMergeInterface } from '../interface/sync-derived-merge.interface';
import type { SyncRecurringSeriesRowInterface } from '../interface/sync-recurring-series-row.interface';

const USER_STATE_RANK: Readonly<Record<string, number>> = {
    [RecurringSeriesUserStateEnum.SUGGESTED]: 0,
    [RecurringSeriesUserStateEnum.CONFIRMED]: 1,
    [RecurringSeriesUserStateEnum.DISMISSED]: 2
};

export class SyncDerivedMatcherService extends Context.Service<SyncDerivedMatcherService>()('@budgie/contracts/SyncDerivedMatcherService', {
    make: Effect.sync(() => {
        const rankOf = (row: SyncRecurringSeriesRowInterface): number => USER_STATE_RANK[row.userState] ?? 0;
        const byIdentity = (first: SyncRecurringSeriesRowInterface, second: SyncRecurringSeriesRowInterface): number =>
            first.syncId < second.syncId ? -1 : Number(first.syncId > second.syncId);
        const pickBest = (
            group: readonly SyncRecurringSeriesRowInterface[],
            score: (row: SyncRecurringSeriesRowInterface) => number
        ): SyncRecurringSeriesRowInterface =>
            group.reduce((best, candidate) => (score(candidate) > score(best) ? candidate : best), group[0]);

        const findCandidateRows = (touchedSyncIds: readonly string[]) =>
            Db.query(db =>
                db.$client.unsafe<SyncRecurringSeriesRowInterface>(
                    `SELECT r.rowid AS localId, r.sync_zone AS syncZone, r.sync_id AS syncId, r.kind AS kind, r.merchant_key AS merchantKey,
                        r.period_days AS periodDays, r.user_state AS userState, r.status AS status, r.amount AS amount, r.title AS title,
                        r.category_id AS categoryId, r.last_seen_at AS lastSeenAt, r.updated_at AS updatedAt
                    FROM recurring_series r
                    WHERE r.deleted_at IS NULL AND EXISTS (
                        SELECT 1 FROM recurring_series t
                        WHERE t.sync_id IN (${touchedSyncIds.map(() => '?').join(', ')}) AND t.deleted_at IS NULL
                            AND t.sync_zone = r.sync_zone AND t.kind = r.kind AND t.merchant_key = r.merchant_key AND t.period_days = r.period_days
                    )
                    ORDER BY r.sync_zone, r.sync_id`,
                    [...touchedSyncIds]
                )
            );

        const mergeGroup = Effect.fnUntraced(function* (group: readonly SyncRecurringSeriesRowInterface[]) {
            const ordered = group.toSorted(byIdentity);
            const [winner, ...losers] = ordered;
            const stateSource = pickBest(ordered, rankOf);
            const freshest = pickBest(ordered, row => row.lastSeenAt);
            const mergedAt = Math.max(...group.map(row => row.updatedAt));
            const loserIds = losers.map(({ localId }) => localId);
            const loserPlaceholders = loserIds.map(() => '?').join(', ');

            yield* Db.mutation(
                { type: 'update', tables: ['recurring_series'] },
                Db.query(db =>
                    db.$client.unsafe(
                        `UPDATE recurring_series SET user_state = ?, title = ?, amount = ?, status = ?, category_id = ?, last_seen_at = ?,
                            updated_at = CASE WHEN user_state IS NOT ? OR title IS NOT ? OR amount IS NOT ? OR status IS NOT ?
                                OR category_id IS NOT ? OR last_seen_at IS NOT ? THEN ? ELSE updated_at END
                        WHERE rowid = ?`,
                        [
                            stateSource.userState,
                            stateSource.title,
                            freshest.amount,
                            freshest.status,
                            freshest.categoryId,
                            freshest.lastSeenAt,
                            stateSource.userState,
                            stateSource.title,
                            freshest.amount,
                            freshest.status,
                            freshest.categoryId,
                            freshest.lastSeenAt,
                            mergedAt,
                            winner.localId
                        ]
                    )
                )
            );
            yield* Db.mutation(
                { type: 'update', tables: ['budget_sinking_funds'] },
                Db.query(db =>
                    db.$client.unsafe(
                        `UPDATE budget_sinking_funds SET recurring_series_id = ? WHERE recurring_series_id IN (${loserPlaceholders})`,
                        [winner.localId, ...loserIds]
                    )
                )
            );
            yield* Db.mutation(
                { type: 'update', tables: ['recurring_series'] },
                Db.query(db =>
                    db.$client.unsafe(`UPDATE recurring_series SET deleted_at = ? WHERE rowid IN (${loserPlaceholders})`, [mergedAt, ...loserIds])
                )
            );

            return {
                recordType: 'RecurringSeries',
                keptSyncId: winner.syncId,
                droppedSyncIds: losers.map(({ syncId }) => syncId)
            } satisfies SyncDerivedMergeInterface;
        });

        return {
            mergeRecurringSeries: Effect.fn('SyncDerivedMatcherService.mergeRecurringSeries')(function* (touchedSyncIds: readonly string[]) {
                if (isEmptyArray(touchedSyncIds)) {
                    return [];
                }

                const groups = new Map<string, SyncRecurringSeriesRowInterface[]>();

                for (const row of yield* findCandidateRows(touchedSyncIds)) {
                    const key = `${row.syncZone}|${row.kind}|${row.merchantKey}|${row.periodDays}`;

                    groups.set(key, [...(groups.get(key) ?? []), row]);
                }

                const merges: SyncDerivedMergeInterface[] = [];

                for (const group of groups.values()) {
                    if (isNotEmptyArray(group.slice(1))) {
                        merges.push(yield* mergeGroup(group));
                    }
                }

                return merges;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncDerivedMatcherService, SyncDerivedMatcherService.make);
}
