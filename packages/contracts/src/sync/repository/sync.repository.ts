import { and, asc, eq, getTableColumns, isNull, lt, or } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

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

export class SyncRepository {
    readonly update = Effect.fn('SyncRepository.update')(function* (id: number, input: SyncUpdateEntityInterface) {
        const [sync] = yield* Db.query(db =>
            db
                .update(SyncEntityTable)
                .set({ ...input })
                .where(eq(SyncEntityTable.id, id))
                .returning()
        );

        return sync;
    });

    readonly getPendingForwardSync = Effect.fn('SyncRepository.getPendingForwardSync')(function* (
        this: SyncRepository,
        provider: ExternalSourceEnum,
        staleThresholdMs: number
    ) {
        const staleTime = new Date(Date.now() - staleThresholdMs);

        return yield* Db.query(db =>
            this.selectWithActiveAccount(db)
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
    });

    readonly resetForWindowedResync = Effect.fn('SyncRepository.resetForWindowedResync')(function* (accountId: number, since: Date) {
        yield* Db.query(db =>
            db
                .update(SyncEntityTable)
                .set({
                    mode: SyncModeEnum.FORWARD,
                    status: SyncStatusEnum.IDLE,
                    forwardSyncFromAt: since,
                    forwardSyncedAt: null
                })
                .where(eq(SyncEntityTable.accountId, accountId))
        );
    });

    readonly create = Effect.fn('SyncRepository.create')(function* (input: SyncCreateEntityInterface) {
        const [sync] = yield* Db.query(db => db.insert(SyncEntityTable).values([input]).returning());

        return sync;
    });

    readonly getById = Effect.fn('SyncRepository.getById')(function* (id: number) {
        return yield* Db.query(db =>
            db.query.SyncEntityTable.findFirst({
                where: and(eq(SyncEntityTable.id, id), isNull(SyncEntityTable.deletedAt))
            })
        );
    });

    readonly getByAccountId = Effect.fn('SyncRepository.getByAccountId')(function* (accountId: number) {
        return yield* Db.query(db =>
            db.query.SyncEntityTable.findFirst({
                where: and(eq(SyncEntityTable.accountId, accountId), isNull(SyncEntityTable.deletedAt))
            })
        );
    });

    readonly getByProvider = Effect.fn('SyncRepository.getByProvider')(function* (provider: ExternalSourceEnum) {
        return yield* Db.query(db =>
            db.query.SyncEntityTable.findMany({
                where: and(eq(SyncEntityTable.provider, provider), isNull(SyncEntityTable.deletedAt))
            })
        );
    });

    readonly getEnabledByProvider = Effect.fn('SyncRepository.getEnabledByProvider')(function* (
        this: SyncRepository,
        provider: ExternalSourceEnum
    ) {
        return yield* Db.query(db => this.selectWithActiveAccount(db).where(and(...this.buildEnabledProviderConditions(provider))));
    });

    readonly getPendingBackwardSync = Effect.fn('SyncRepository.getPendingBackwardSync')(function* (
        this: SyncRepository,
        provider: ExternalSourceEnum
    ) {
        return yield* Db.query(db =>
            this.selectWithActiveAccount(db)
                .where(and(...this.buildEnabledProviderConditions(provider), eq(SyncEntityTable.mode, SyncModeEnum.BACKWARD)))
                .orderBy(asc(SyncEntityTable.backwardBatchAt), asc(SyncEntityTable.id))
        );
    });

    readonly setStatus = Effect.fn('SyncRepository.setStatus')(function* (id: number, status: SyncStatusEnum) {
        yield* Db.query(db => db.update(SyncEntityTable).set({ status }).where(eq(SyncEntityTable.id, id)));
    });

    readonly setEnabled = Effect.fn('SyncRepository.setEnabled')(function* (accountId: number, enabled: boolean) {
        yield* Db.query(db => db.update(SyncEntityTable).set({ enabled }).where(eq(SyncEntityTable.accountId, accountId)));
    });

    readonly recordError = Effect.fn('SyncRepository.recordError')(function* (this: SyncRepository, id: number, error: string) {
        const sync = yield* this.getById(id);

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
    });

    readonly resetForResync = Effect.fn('SyncRepository.resetForResync')(function* (accountId: number, setupBalance: number | null) {
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
    });

    readonly truncate = Effect.fn('SyncRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(SyncEntityTable));
    });

    constructor(private db: DB) {}

    findByAccountId(accountId: number) {
        return this.db.query.SyncEntityTable.findFirst({
            where: and(eq(SyncEntityTable.accountId, accountId), isNull(SyncEntityTable.deletedAt))
        });
    }

    private buildEnabledProviderConditions(provider: ExternalSourceEnum) {
        return [
            eq(SyncEntityTable.provider, provider),
            eq(SyncEntityTable.enabled, true),
            isNull(SyncEntityTable.deletedAt),
            isNull(AccountEntityTable.deletedAt)
        ];
    }

    private selectWithActiveAccount(db: DB) {
        return db
            .select(getTableColumns(SyncEntityTable))
            .from(SyncEntityTable)
            .innerJoin(AccountEntityTable, eq(SyncEntityTable.accountId, AccountEntityTable.id))
            .$dynamic();
    }
}
