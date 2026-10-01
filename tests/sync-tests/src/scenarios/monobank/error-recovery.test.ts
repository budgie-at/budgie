import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { http, HttpResponse } from 'msw';

import { SYNC_ERROR_THRESHOLD, expectSyncFailedAndDisabled, httpFailureCases, setupMonobankFixture, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

describe('monobank/error-recovery', () => {
    it.effect.each(httpFailureCases)(
        `marks the sync FAILED + disabled after ${SYNC_ERROR_THRESHOLD} consecutive $label errors`,
        ({ status }) =>
            Effect.gen(function* () {
                const monobankSyncService = yield* MonobankSyncService;
                const { sync } = yield* setupMonobankFixture();
                mockServer.use(
                    http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => new HttpResponse(null, { status }))
                );

                yield* monobankSyncService.sync();

                yield* expectSyncFailedAndDisabled(sync.id);
            }).pipe(Effect.provide(TestLayer))
    );
});
