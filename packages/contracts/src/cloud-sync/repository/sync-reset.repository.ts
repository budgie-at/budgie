import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { MOVED_TO_TOMBSTONE_SQL } from '../constant/moved-to-tombstone-sql.constant';
import { PERSONAL_SYNC_ZONE } from '../constant/personal-sync-zone.constant';
import { SYNC_IDENTITY_TABLES } from '../constant/sync-identity-tables.constant';
import { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';

import { SyncApplyStateRepository } from './sync-apply-state.repository';

export class SyncResetRepository extends Context.Service<SyncResetRepository>()('@budgie/contracts/SyncResetRepository', {
    make: Effect.gen(function* () {
        const syncApplyStateRepository = yield* SyncApplyStateRepository;
        const deletionOrder = [
            'transactions',
            'debt_events',
            'recurring_series',
            'budgets',
            'rules',
            'accounts',
            'comment_embeddings',
            'merchant_embeddings',
            'categories',
            'tags',
            'bank_integrations',
            'sync_record',
            'sync_outbox',
            'sync_pending'
        ];
        const touchedTables = [
            ...SYNC_IDENTITY_TABLES.map(table => table.name),
            'comment_embeddings',
            'merchant_embeddings',
            'account_balances',
            'sync_record',
            'sync_outbox',
            'sync_pending'
        ];

        const clearStateConditions: Readonly<Record<string, string>> = {
            sync_record: ` WHERE NOT (${MOVED_TO_TOMBSTONE_SQL})`,
            sync_outbox:
                " WHERE NOT (operation = 'DELETE' AND EXISTS (SELECT 1 FROM json_each(changed_columns) WHERE value LIKE '@movedTo:%'))"
        };

        return {
            clearSyncedData: Effect.fn('SyncResetRepository.clearSyncedData')(function* () {
                yield* syncApplyStateRepository.withoutTriggers(
                    Effect.gen(function* () {
                        yield* Db.mutation(
                            { type: 'update', tables: ['settings'] },
                            Db.query(db => db.$client.unsafe('UPDATE settings SET default_account_id = NULL'))
                        );
                        yield* Db.mutation(
                            { type: 'delete', tables: touchedTables },
                            Effect.forEach(
                                deletionOrder,
                                tableName =>
                                    Db.query(db =>
                                        db.$client.unsafe(
                                            `DELETE FROM ${tableName}${tableName === 'categories' ? ' WHERE is_default = 0' : ''}`
                                        )
                                    ),
                                {
                                    discard: true
                                }
                            )
                        );
                    })
                );
            }),
            clearPendingWork: Effect.fn('SyncResetRepository.clearPendingWork')(function* () {
                yield* Db.mutation(
                    { type: 'delete', tables: ['sync_outbox', 'sync_pending'] },
                    Effect.forEach(
                        ['sync_outbox', 'sync_pending'],
                        tableName => Db.query(db => db.$client.unsafe(`DELETE FROM ${tableName}`)),
                        {
                            discard: true
                        }
                    )
                );
            }),
            clearSyncState: Effect.fn('SyncResetRepository.clearSyncState')(function* () {
                yield* Db.mutation(
                    { type: 'update', tables: ['sync_record'] },
                    Db.query(db =>
                        db.$client.unsafe(`UPDATE sync_record SET system_fields = NULL WHERE ${MOVED_TO_TOMBSTONE_SQL}`, [
                            PERSONAL_SYNC_ZONE,
                            SyncRecordTypeEnum.ACCOUNT
                        ])
                    )
                );
                yield* Db.mutation(
                    { type: 'delete', tables: ['sync_record', 'sync_outbox', 'sync_pending'] },
                    Effect.forEach(
                        ['sync_record', 'sync_outbox', 'sync_pending'],
                        tableName =>
                            Db.query(db =>
                                db.$client.unsafe(
                                    `DELETE FROM ${tableName}${clearStateConditions[tableName] ?? ''}`,
                                    tableName === 'sync_record' ? [PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.ACCOUNT] : []
                                )
                            ),
                        {
                            discard: true
                        }
                    )
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncResetRepository, SyncResetRepository.make).pipe(Layer.provide(SyncApplyStateRepository.layer));
}
