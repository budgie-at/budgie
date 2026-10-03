import { and, asc, eq, getTableColumns, isNull, lt, or } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SyncModeEnum } from '../enum/sync-mode.enum';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncEntityTable } from '../table/sync-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { SyncCreateEntityInterface } from '../entity/sync-create-entity.interface';
import type { SyncUpdateEntityInterface } from '../entity/sync-update-entity.interface';

export class SyncRepository extends Context.Service<SyncRepository>()('@budgie/contracts/SyncRepository', {
    make: Effect.sync(() => {
        const buildEnabledProviderConditions = (provider: ExternalSourceEnum) => [
            eq(SyncEntityTable.provider, provider),
            eq(SyncEntityTable.enabled, true),
            isNull(SyncEntityTable.deletedAt),
            isNull(AccountEntityTable.deletedAt)
        ];

        const selectWithActiveAccount = (db: DB) =>
            db
                .select(getTableColumns(SyncEntityTable))
                .from(SyncEntityTable)
                .innerJoin(AccountEntityTable, eq(SyncEntityTable.accountId, AccountEntityTable.id))
                .$dynamic();

        const getById = (id: number) =>
            Db.query(db =>
                db.query.SyncEntityTable.findFirst({
                    where: { id, deletedAt: { isNull: true } }
                })
            );

        return {
            getById,
            getPendingForwardSync: Effect.fn('SyncRepository.getPendingForwardSync')(function* (
                provider: ExternalSourceEnum,
                staleThresholdMs: number
            ) {
                const staleTime = new Date(Date.now() - staleThresholdMs);

                return yield* Db.query(db =>
                    selectWithActiveAccount(db)
                        .where(
                            and(
                                eq(SyncEntityTable.provider, provider),
                                eq(SyncEntityTable.enabled, true),
                                eq(SyncEntityTable.mode, SyncModeEnum.FORWARD),
                                isNull(SyncEntityTable.deletedAt),
                                isNull(AccountEntityTable.deletedAt),
                                or(isNull(SyncEntityTable.forwardSyncedAt), lt(SyncEntityTable.forwardSyncedAt, staleTime))
                            )
                        )
                        .orderBy(asc(SyncEntityTable.forwardSyncedAt))
                );
            }),
            recordError: Effect.fn('SyncRepository.recordError')(function* (id: number, error: string) {
                const sync = yield* getById(id);

                if (isDefined(sync)) {
                    yield* Db.query(db =>
                        db
                            .update(SyncEntityTable)
                            .set({
                                lastError: error,
                                errorCount: sync.errorCount + 1
                            })
                            .where(eq(SyncEntityTable.id, id))
                    );
                }
            }),
            resetForResync: Effect.fn('SyncRepository.resetForResync')(function* (accountId: number, setupBalance: number | null) {
                const now = new Date();

                yield* Db.query(db =>
                    db
                        .update(SyncEntityTable)
                        .set({
                            mode: SyncModeEnum.BACKWARD,
                            status: SyncStatusEnum.IDLE,
                            backwardSyncFromAt: now,
                            backwardSyncedAt: null,
                            backwardSyncLimitAt: null,
                            forwardSyncFromAt: now,
                            forwardSyncedAt: null,
                            backwardBatchAt: null,
                            setupBalance,
                            transactionCount: 0,
                            errorCount: 0,
                            lastError: null
                        })
                        .where(eq(SyncEntityTable.accountId, accountId))
                );
            }),
            update: (id: number, input: SyncUpdateEntityInterface) =>
                Db.query(db =>
                    db
                        .update(SyncEntityTable)
                        .set({ ...input })
                        .where(eq(SyncEntityTable.id, id))
                        .returning()
                ).pipe(Effect.map(([sync]) => sync)),
            resetForWindowedResync: (accountId: number, since: Date) =>
                Db.query(db =>
                    db
                        .update(SyncEntityTable)
                        .set({
                            mode: SyncModeEnum.FORWARD,
                            status: SyncStatusEnum.IDLE,
                            forwardSyncFromAt: since,
                            forwardSyncedAt: null
                        })
                        .where(eq(SyncEntityTable.accountId, accountId))
                ),
            create: (input: SyncCreateEntityInterface) =>
                Db.query(db => db.insert(SyncEntityTable).values([input]).returning()).pipe(Effect.map(([sync]) => sync)),
            getByAccountId: (accountId: number) =>
                Db.query(db =>
                    db.query.SyncEntityTable.findFirst({
                        where: { accountId, deletedAt: { isNull: true } }
                    })
                ),
            getByProvider: (provider: ExternalSourceEnum) =>
                Db.query(db =>
                    db.query.SyncEntityTable.findMany({
                        where: { provider, deletedAt: { isNull: true } }
                    })
                ),
            getEnabledByProvider: (provider: ExternalSourceEnum) =>
                Db.query(db => selectWithActiveAccount(db).where(and(...buildEnabledProviderConditions(provider)))),
            getPendingBackwardSync: (provider: ExternalSourceEnum) =>
                Db.query(db =>
                    selectWithActiveAccount(db)
                        .where(and(...buildEnabledProviderConditions(provider), eq(SyncEntityTable.mode, SyncModeEnum.BACKWARD)))
                        .orderBy(asc(SyncEntityTable.backwardBatchAt), asc(SyncEntityTable.id))
                ),
            setStatus: (id: number, status: SyncStatusEnum) =>
                Db.query(db => db.update(SyncEntityTable).set({ status }).where(eq(SyncEntityTable.id, id))),
            setEnabled: (accountId: number, enabled: boolean) =>
                Db.query(db => db.update(SyncEntityTable).set({ enabled }).where(eq(SyncEntityTable.accountId, accountId))),
            truncate: () => Db.query(db => db.delete(SyncEntityTable))
        };
    })
}) {
    static readonly layer = Layer.effect(SyncRepository, SyncRepository.make);
}
