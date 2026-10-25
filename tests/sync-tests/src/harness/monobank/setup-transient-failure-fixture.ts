import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

export const setupTransientFailureFixture = Effect.fnUntraced(function* (mode: SyncModeEnum) {
    const cursor = new Date(Math.floor(Date.now() / 1000) * 1000 - 86_400_000);
    const selected = yield* seed.account({ externalId: 'mono-broken', type: AccountTypeEnum.BANK_SYNC });
    const shared = yield* seed.account({ externalId: 'mono-shared', type: AccountTypeEnum.BANK_SYNC });
    const healthy = yield* seed.account({ externalId: 'mono-healthy', type: AccountTypeEnum.BANK_SYNC });
    const paused = yield* seed.account({ externalId: 'mono-paused', type: AccountTypeEnum.BANK_SYNC });
    const failed = yield* seed.sync({
        accountId: selected.id,
        provider: ExternalSourceEnum.MONOBANK,
        token: 'broken-endpoint-token',
        enabled: true,
        errorCount: 3,
        status: SyncStatusEnum.FAILED,
        lastError: 'Previous failure',
        mode,
        forwardSyncFromAt: cursor,
        forwardSyncedAt: cursor,
        backwardSyncFromAt: cursor,
        backwardSyncLimitAt: new Date(cursor.getTime() - 86_400_000)
    });
    const sharedSync = yield* seed.sync({
        accountId: shared.id,
        provider: ExternalSourceEnum.MONOBANK,
        token: 'broken-endpoint-token',
        mode,
        forwardSyncFromAt: cursor,
        forwardSyncedAt: cursor,
        backwardSyncFromAt: cursor,
        backwardSyncLimitAt: new Date(cursor.getTime() - 86_400_000)
    });
    const good = yield* seed.sync({
        accountId: healthy.id,
        provider: ExternalSourceEnum.MONOBANK,
        token: 'healthy-independent-token',
        mode,
        forwardSyncFromAt: cursor,
        forwardSyncedAt: new Date(cursor.getTime() + 1_000),
        backwardSyncFromAt: cursor,
        backwardSyncLimitAt: new Date(cursor.getTime() - 86_400_000)
    });
    const pausedSync = yield* seed.sync({ accountId: paused.id, enabled: false, mode });

    return { cursor, failed, good, pausedSync, sharedSync };
});
