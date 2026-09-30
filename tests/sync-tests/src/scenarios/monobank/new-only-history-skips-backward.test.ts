import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectForwardSyncWithoutHistory, seed, stubEmptyStatements, TestLayer } from '../../harness';

describe('monobank/new-only-history-skips-backward', () => {
    it.effect('completes the backward sweep with zero statement requests when backwardSyncFromAt equals backwardSyncLimitAt', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const historyBoundary = new Date();
            const account = seed.account({ externalId: 'mono-acc-new-only', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            const bankSync = seed.sync({
                accountId: account.id,
                mode: SyncModeEnum.BACKWARD,
                backwardSyncFromAt: historyBoundary,
                backwardSyncLimitAt: historyBoundary,
                forwardSyncedAt: historyBoundary
            });

            const requestedFromValues: number[] = [];
            stubEmptyStatements(fromUnixSeconds => {
                requestedFromValues.push(fromUnixSeconds);
            });

            yield* monobankSyncService.sync();

            expect(requestedFromValues).toHaveLength(0);
            expectForwardSyncWithoutHistory(bankSync.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
