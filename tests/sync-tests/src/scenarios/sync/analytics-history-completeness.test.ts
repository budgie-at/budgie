import { AccountEntityTable, Db, SyncEntityTable, SyncModeEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, TestLayer } from '../../harness';
import { explainQueryPlan } from '../../harness/db/explain-query-plan';

describe('sync/analytics-history-completeness', () => {
    it.effect('reads paused and failed history without scheduling it and excludes deleted records and forward updates', () =>
        Effect.gen(function* () {
            const repository = yield* SyncRepository;
            const activeAccount = yield* seed.account({ title: 'Importing' });
            const pausedAccount = yield* seed.account({ title: 'Paused' });
            const failedAccount = yield* seed.account({ title: 'Failed' });
            const forwardAccount = yield* seed.account({ title: 'Complete' });
            const deletedAccount = yield* seed.account({ title: 'Deleted account' });
            const deletedSyncAccount = yield* seed.account({ title: 'Deleted sync' });
            const active = yield* seed.sync({ accountId: activeAccount.id, mode: SyncModeEnum.BACKWARD });
            const paused = yield* seed.sync({ accountId: pausedAccount.id, mode: SyncModeEnum.BACKWARD, enabled: false });
            const failed = yield* seed.sync({
                accountId: failedAccount.id,
                mode: SyncModeEnum.BACKWARD,
                enabled: false,
                status: SyncStatusEnum.FAILED
            });
            yield* seed.sync({ accountId: forwardAccount.id, mode: SyncModeEnum.FORWARD });
            yield* seed.sync({ accountId: deletedAccount.id, mode: SyncModeEnum.BACKWARD });
            const deletedSync = yield* seed.sync({ accountId: deletedSyncAccount.id, mode: SyncModeEnum.BACKWARD });
            yield* Db.query(database =>
                database
                    .update(AccountEntityTable)
                    .set({ deletedAt: new Date('2026-10-01') })
                    .where(eq(AccountEntityTable.id, deletedAccount.id))
            );
            yield* Db.query(database =>
                database
                    .update(SyncEntityTable)
                    .set({ deletedAt: new Date('2026-10-01') })
                    .where(eq(SyncEntityTable.id, deletedSync.id))
            );

            const rows = yield* repository.getHistorySyncs();
            expect(rows.map(row => row.sync.id).sort((left, right) => left - right)).toEqual(
                [active.id, paused.id, failed.id].sort((left, right) => left - right)
            );
            expect(rows.find(row => row.sync.id === paused.id)?.account.title).toBe('Paused');
            expect((yield* repository.getAllPendingBackwardSyncs()).map(sync => sync.id)).toEqual([active.id]);
            expect(yield* explainQueryPlan(repository.getHistorySyncs())).not.toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
