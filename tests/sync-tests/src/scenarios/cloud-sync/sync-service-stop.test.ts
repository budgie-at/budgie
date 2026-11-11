import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Latch from 'effect/Latch';

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
    it.effect('keeps the engine stopped when stop arrives while start is still running', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const gate = { reached: Latch.makeUnsafe(), release: Latch.makeUnsafe() };
                context.transport.behavior.accountStatusGate = gate;
                context.store.holder.state = { ...context.store.holder.state, isHouseholdCleanupPending: true };

                const startFiber = yield* Effect.forkChild(service.start());
                yield* gate.reached.await;
                const stopFiber = yield* Effect.forkChild(service.stop());
                yield* Effect.yieldNow;
                yield* gate.release.open;
                yield* Fiber.join(startFiber);

                expect(yield* Fiber.join(stopFiber)).toBe(true);
                expect(context.transport.calls.isRunning).toBe(false);
            })
        )
    );
    it.effect('starts the engine once when start is called concurrently', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* Effect.all([service.start(), service.start()], { concurrency: 'unbounded' });

                expect(context.transport.calls.started.length).toBe(1);
                expect(yield* service.stop()).toBe(true);
                expect(yield* service.stop()).toBe(false);
            })
        )
    );
});
