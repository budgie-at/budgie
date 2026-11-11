import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runSyncService } from '../../harness';

describe('cloud-sync/sync-service stop', () => {
    it.effect('does nothing before the service was started', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                expect(yield* service.stop()).toBe(false);
                expect(context.transport.calls.stopped).toBe(0);
            })
        )
    );
    it.effect('stops the engine once after start and can be started again', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* service.start();
                const startedCount = context.transport.calls.started.length;

                expect(yield* service.stop()).toBe(true);
                expect(context.transport.calls.stopped).toBe(1);
                expect(yield* service.stop()).toBe(false);
                expect(context.transport.calls.stopped).toBe(1);

                yield* service.start();

                expect(context.transport.calls.started.length).toBeGreaterThan(startedCount);
                expect(yield* service.stop()).toBe(true);
            })
        )
    );
});
