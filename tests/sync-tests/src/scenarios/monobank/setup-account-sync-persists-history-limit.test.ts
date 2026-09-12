import { SyncHistoryDepthEnum } from '@app/sync/enum/sync-history-depth.enum';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { buildMonobank, monobankStub, seed, subtractMonths, testDb } from '../../harness';

import type { SyncEntityInterface } from '@budgie/contracts';

const BACKGROUND_TASK_SUCCESS_RESULT = 1;
const HISTORY_LIMIT_MONTHS = 3;
const HISTORY_LIMIT_TOLERANCE_MS = 5_000;

const fetchSyncByAccountId = (accountId: number): SyncEntityInterface => {
    const [row] = testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.accountId, accountId)).all();

    return row;
};

const setupAccountSyncWithDepth = async (externalId: string, historyDepth: SyncHistoryDepthEnum): Promise<SyncEntityInterface> => {
    const account = seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    monobankStub.clientInfo(buildMonobank.clientInfoWith([externalId]));
    const registerBackgroundTaskSpy = vi.spyOn(monobankSyncService, 'registerBackgroundTask').mockResolvedValue();
    const syncSpy = vi.spyOn(monobankSyncService, 'sync').mockResolvedValue(BACKGROUND_TASK_SUCCESS_RESULT);

    try {
        await monobankSyncService.setupAccountSyncBatch('test-token', [externalId], historyDepth);

        return fetchSyncByAccountId(account.id);
    } finally {
        registerBackgroundTaskSpy.mockRestore();
        syncSpy.mockRestore();
    }
};

describe('monobank/setup-account-sync-persists-history-limit', () => {
    it('persists a backwardSyncLimitAt near subMonths(now, 3) for MONTHS_3 depth', async () => {
        const createdSync = await setupAccountSyncWithDepth('mono-acc-history-limit-months-3', SyncHistoryDepthEnum.MONTHS_3);

        const expectedLimitAt = subtractMonths(new Date(), HISTORY_LIMIT_MONTHS);
        expect(createdSync.backwardSyncLimitAt).not.toBeNull();
        const actualLimitAtMs = createdSync.backwardSyncLimitAt?.getTime() ?? 0;
        expect(Math.abs(actualLimitAtMs - expectedLimitAt.getTime())).toBeLessThan(HISTORY_LIMIT_TOLERANCE_MS);
    });

    it('leaves backwardSyncLimitAt null for FULL depth', async () => {
        const createdSync = await setupAccountSyncWithDepth('mono-acc-history-limit-full', SyncHistoryDepthEnum.FULL);

        expect(createdSync.backwardSyncLimitAt).toBeNull();
    });
});
