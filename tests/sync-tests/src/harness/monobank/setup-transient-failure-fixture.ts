import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

export const setupTransientFailureFixture = Effect.fnUntraced(function* (mode: SyncModeEnum) {
    const cursor = new Date(Math.floor(Date.now() / 1000) * 1000 - 86_400_000);
    const selected = yield* seed.account({ externalId: 'mono-broken', type: AccountTypeEnum.BANK_SYNC });
    const shared = yield* seed.account({ externalId: 'mono-shared', type: AccountTypeEnum.BANK_SYNC });
    const healthy = yield* seed.account({ externalId: 'mono-healthy', type: AccountTypeEnum.BANK_SYNC });
    const paused = yield* seed.account({ externalId: 'mono-paused', type: AccountTypeEnum.BANK_SYNC });
    const seedMonobankSync = (accountId: number, token: string, overrides: Partial<Parameters<typeof seed.sync>[0]> = {}) =>
        seed.sync({
            accountId,
            provider: ExternalSourceEnum.MONOBANK,
            token,
            mode,
            forwardSyncFromAt: cursor,
            forwardSyncedAt: cursor,
            backwardSyncFromAt: cursor,
            backwardSyncLimitAt: new Date(cursor.getTime() - 86_400_000),
            ...overrides
        });
    const failed = yield* seedMonobankSync(selected.id, 'broken-endpoint-token', {
        enabled: true,
        errorCount: 3,
        status: SyncStatusEnum.FAILED,
        lastError: 'Previous failure'
    });
    const sharedSync = yield* seedMonobankSync(shared.id, 'broken-endpoint-token');
    const good = yield* seedMonobankSync(healthy.id, 'healthy-independent-token', { forwardSyncedAt: new Date(cursor.getTime() + 1_000) });
    const pausedSync = yield* seed.sync({ accountId: paused.id, enabled: false, mode });

    return { cursor, failed, good, pausedSync, sharedSync };
});
