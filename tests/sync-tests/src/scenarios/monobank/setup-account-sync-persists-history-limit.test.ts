import { SyncHistoryDepthEnum } from '@app/sync/enum/sync-history-depth.enum';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, SyncEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, seed, skipRequestedSync, subtractMonths, testDb, TestLayer } from '../../harness';


const HISTORY_LIMIT_MONTHS = 3;
const HISTORY_LIMIT_TOLERANCE_MS = 5_000;

const fetchSyncByAccountId = (accountId: number) =>
    Effect.gen(function* () {
        const [row] = yield* testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.accountId, accountId));

        return row;
    });

const setupAccountSyncWithDepth = Effect.fnUntraced(function* (externalId: string, historyDepth: SyncHistoryDepthEnum) {
    const monobankSyncService = yield* MonobankSyncService;
    const account = yield* seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    monobankStub.clientInfo(buildMonobank.clientInfoWith([externalId]));

    yield* skipRequestedSync(monobankSyncService.setupAccountSyncBatch('test-token', [externalId], historyDepth));

    return yield* fetchSyncByAccountId(account.id);
});

describe('monobank/setup-account-sync-persists-history-limit', () => {
    it.effect('persists a backwardSyncLimitAt near subMonths(now, 3) for MONTHS_3 depth', () =>
        Effect.gen(function* () {
            const createdSync = yield* setupAccountSyncWithDepth('mono-acc-history-limit-months-3', SyncHistoryDepthEnum.MONTHS_3);

            const expectedLimitAt = subtractMonths(new Date(), HISTORY_LIMIT_MONTHS);
            expect(createdSync.backwardSyncLimitAt).not.toBeNull();
            const actualLimitAtMs = createdSync.backwardSyncLimitAt?.getTime() ?? 0;
            expect(Math.abs(actualLimitAtMs - expectedLimitAt.getTime())).toBeLessThan(HISTORY_LIMIT_TOLERANCE_MS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves backwardSyncLimitAt null for FULL depth', () =>
        Effect.gen(function* () {
            const createdSync = yield* setupAccountSyncWithDepth('mono-acc-history-limit-full', SyncHistoryDepthEnum.FULL);

            expect(createdSync.backwardSyncLimitAt).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
