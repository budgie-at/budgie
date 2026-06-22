import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { microPause } from '@app/@generic/utils/micro-pause.util';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { monobankServer } from '../../harness/monobank/monobank-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const staleForwardSyncFromAt = new Date(2026, 0, 1);
const syncStartedAt = new Date(2026, 0, 1, 12, 0, 0);
const oneMinuteMs = 60_000;

enum SyncRunResultEnum {
    COMPLETED = 'COMPLETED',
    DUPLICATE = 'DUPLICATE',
    STOPPED = 'STOPPED'
}

describe('monobank/forward-sync-run-boundary', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.mocked(microPause).mockImplementation(async (): Promise<void> => undefined);
    });

    it('does not select the same forward sync again during one sync run', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(syncStartedAt);

        const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
        const requestedAccountIds: string[] = [];
        let shouldStopSync = false;
        let resolveDuplicateRequest: ((value: SyncRunResultEnum.DUPLICATE) => void) | null = null;
        const duplicateRequest = new Promise<SyncRunResultEnum.DUPLICATE>(resolve => {
            resolveDuplicateRequest = resolve;
        });

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

        vi.mocked(microPause).mockImplementation(async (): Promise<void> => {
            if (shouldStopSync) {
                throw new Error('duplicate forward sync selected');
            }

            vi.setSystemTime(new Date(Date.now() + oneMinuteMs));
        });

        monobankServer.use(
            http.get(statementEndpoint, ({ params }) => {
                requestedAccountIds.push(String(params['account']));
                if (requestedAccountIds.length > externalIds.length) {
                    shouldStopSync = true;
                    resolveDuplicateRequest?.(SyncRunResultEnum.DUPLICATE);
                }

                return HttpResponse.json([]);
            })
        );

        const syncRun = monobankSyncService.sync().then(
            () => SyncRunResultEnum.COMPLETED,
            () => SyncRunResultEnum.STOPPED
        );
        const result = await Promise.race([syncRun, duplicateRequest]);

        expect(result).toBe(SyncRunResultEnum.COMPLETED);
        expect(requestedAccountIds).toEqual(externalIds);
    });
});
