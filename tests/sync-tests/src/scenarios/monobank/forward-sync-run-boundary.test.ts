import { microPause } from '@app/@generic/utils/micro-pause.util';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date('2026-01-01T00:00:00.000Z');
const syncStartedAt = new Date('2026-01-01T12:00:00.000Z');
const oneMinuteMs = 60_000;

enum SyncRunResultEnum {
    COMPLETED = 'COMPLETED',
    STOPPED = 'STOPPED'
}

describe('monobank/forward-sync-run-boundary', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.mocked(microPause).mockImplementation((): Promise<void> => Promise.resolve());
    });

    it('does not select the same forward sync again during one sync run', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(syncStartedAt);

        const externalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];
        const requestedAccountIds: string[] = [];
        let shouldStopSync = false;

        seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);

        vi.mocked(microPause).mockImplementation(async (): Promise<void> => {
            if (shouldStopSync) {
                throw new Error('duplicate forward sync selected');
            }

            vi.setSystemTime(new Date(Date.now() + oneMinuteMs));
        });

        mockServer.use(
            http.get(statementEndpoint, ({ params }) => {
                requestedAccountIds.push(String(params[statementAccountParam]));
                if (requestedAccountIds.length > externalIds.length) {
                    shouldStopSync = true;
                }

                return HttpResponse.json([]);
            })
        );

        const syncRun = monobankSyncService.sync().then(
            () => SyncRunResultEnum.COMPLETED,
            () => SyncRunResultEnum.STOPPED
        );
        const result = await syncRun;

        expect(result).toBe(SyncRunResultEnum.COMPLETED);
        expect(requestedAccountIds).toEqual(externalIds);
    });
});
