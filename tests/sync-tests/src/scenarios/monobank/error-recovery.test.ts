import { describe, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { SYNC_ERROR_THRESHOLD, expectSyncFailedAndDisabled, httpFailureCases, setupMonobankFixture } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

describe('monobank/error-recovery', () => {
    for (const { label, status } of httpFailureCases) {
        it(`marks the sync FAILED + disabled after ${SYNC_ERROR_THRESHOLD} consecutive ${label} errors`, async () => {
            const { sync } = setupMonobankFixture();
            monobankServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => new HttpResponse(null, { status }))
            );

            await monobankSyncService.sync();

            expectSyncFailedAndDisabled(sync.id);
        });
    }
});
