import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SYNC_IDENTITY_TABLES } from '../constant/sync-identity-tables.constant';

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
            'default_category_translations',
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
            'default_category_translations',
            'comment_embeddings',
            'merchant_embeddings',
            'account_balances', 'sync_record', 'sync_outbox', 'sync_pending'];

        return {
            clearSyncedData: Effect.fn('SyncResetRepository.clearSyncedData')(function* () {
                yield* Db.transaction(
                    Effect.gen(function* () {
                        yield* syncApplyStateRepository.setApplying(true);
                        yield* Db.mutation(
                            { type: 'update', tables: ['settings'] },
                            Db.query(db => db.$client.unsafe('UPDATE settings SET default_account_id = NULL'))
                        );
                        yield* Db.mutation(
                            { type: 'delete', tables: touchedTables },
                            Effect.forEach(deletionOrder, tableName => Db.query(db => db.$client.unsafe(`DELETE FROM ${tableName}`)), {
                                discard: true
                            })
                        );
                        yield* syncApplyStateRepository.setApplying(false);
                    })
                );
            }),
            clearPendingWork: Effect.fn('SyncResetRepository.clearPendingWork')(function* () {
                yield* Db.mutation(
                    { type: 'delete', tables: ['sync_outbox', 'sync_pending'] },
                    Effect.forEach(['sync_outbox', 'sync_pending'], tableName => Db.query(db => db.$client.unsafe(`DELETE FROM ${tableName}`)), {
                        discard: true
                    })
                );
            }),
            clearSyncState: Effect.fn('SyncResetRepository.clearSyncState')(function* () {
                yield* Db.mutation(
                    { type: 'delete', tables: ['sync_record', 'sync_outbox', 'sync_pending'] },
                    Effect.forEach(['sync_record', 'sync_outbox', 'sync_pending'], tableName => Db.query(db => db.$client.unsafe(`DELETE FROM ${tableName}`)), {
                        discard: true
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncResetRepository, SyncResetRepository.make).pipe(
        Layer.provide(SyncApplyStateRepository.layer)
    );
}
