import { describe, expect, it } from '@effect/vitest';
import * as Context from 'effect/Context';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as Atom from 'effect/reactivity/Atom';
import * as Semaphore from 'effect/Semaphore';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vitest';

import { appAtomRegistry } from '../src/@generic/constant/app-atom-registry.constant';
import { Workload } from '../src/@generic/service/workload.service';
import { AiSubsystemNameEnum } from '../src/ai/enum/ai-subsystem-name.enum';
import { DrainerStateEnum } from '../src/ai/enum/drainer-state.enum';
import { makeDrainer } from '../src/ai/service/drainer.service';

import { inertDbLayer } from './fixture/inert-db-layer';

import type { DrainerSnapshotInterface } from '../src/ai/interface/drainer-snapshot.interface';
import type { AiModelResidencyService } from '../src/ai/service/ai-model-residency.service';
import type { Db } from '@budgie/contracts';
import type * as Scope from 'effect/Scope';

const appState = vi.hoisted(() => ({ currentState: 'active' }));

vi.mock('react-native', () => ({ AppState: appState }));

class ResidencyTestService extends Context.Service<ResidencyTestService, Context.Service.Shape<typeof AiModelResidencyService>>()(
    'test/ResidencyTestService'
) {}

const residency = { isModelReady: true };

const residencyLayer = Layer.mock(ResidencyTestService)({
    drainLock: Semaphore.makeUnsafe(1),
    acquire: () => Effect.sync(() => residency.isModelReady),
    release: () => Effect.void
});

const testLayer = Workload.layer.pipe(Layer.provideMerge(Layer.mergeAll(residencyLayer, inertDbLayer, FetchHttpClient.layer)));

type Row = Effect.Effect<void>;

interface HarnessOptions {
    readonly rows?: (call: number, limit: number) => Row[];
    readonly pending?: number;
    readonly relaxedIntervalMs?: number;
}

const makeHarness = Effect.fnUntraced(function* ({ rows = () => [], pending = 0, relaxedIntervalMs = 1000 }: HarnessOptions = {}) {
    const service = yield* ResidencyTestService;
    const workload = yield* Workload;
    const fetches: number[] = [];
    const counter = { pending };
    const snapshot = Atom.keepAlive(Atom.make<DrainerSnapshotInterface>({ state: DrainerStateEnum.IDLE, pending, errorMessage: null }));
    const drainer = yield* makeDrainer<never>(
        {
            subsystem: AiSubsystemNameEnum.EMBEDDING,
            relaxedIntervalMs,
            relaxedBatchSize: 5,
            boostBatchSize: 3,
            yieldEveryRows: 100,
            snapshot,
            fetchPending: limit =>
                Effect.sync(() => {
                    fetches.push(limit);

                    return rows(fetches.length, limit);
                }),
            countPending: Effect.sync(() => counter.pending),
            afterBatch: Effect.void
        },
        service
    );

    return {
        drainer,
        fetches,
        counter,
        snapshot,
        setForegroundBusy: (isBusy: boolean) => SubscriptionRef.set(workload.foregroundCount, isBusy ? 1 : 0)
    };
});

const makeGatedRow = Effect.fnUntraced(function* (onDone: () => void) {
    const started = yield* Deferred.make<void>();
    const gate = yield* Deferred.make<void>();

    return {
        row: Deferred.succeed(started, undefined).pipe(Effect.andThen(Deferred.await(gate)), Effect.andThen(Effect.sync(onDone))),
        started: Deferred.await(started),
        open: Deferred.succeed(gate, undefined)
    };
});

const startFailingDrainer = Effect.fnUntraced(function* (failures: number) {
    const harness = yield* makeHarness({ pending: 3, rows: call => (call === 1 ? Array.from({ length: failures }, () => failing) : []) });
    yield* harness.drainer.start();
    yield* advance(1000);

    return harness;
});

const startGatedBoost = Effect.fnUntraced(function* () {
    const processed: number[] = [];
    const gated = yield* makeGatedRow(() => processed.push(1));
    const harness = yield* makeHarness({ pending: 3, rows: () => [gated.row, Effect.sync(() => void processed.push(2))] });
    yield* harness.drainer.start();
    const boosting = yield* Effect.forkChild(harness.drainer.boost());
    yield* gated.started;

    return { ...harness, processed, gated, boosting };
});

const readSnapshot = (snapshot: Atom.Writable<DrainerSnapshotInterface>) => appAtomRegistry.get(snapshot);

const expectRecoveredAndPolling = Effect.fnUntraced(function* (snapshot: Atom.Writable<DrainerSnapshotInterface>, fetches: number[]) {
    expect(readSnapshot(snapshot)).toMatchObject({ state: DrainerStateEnum.IDLE, errorMessage: null });
    yield* advance(1000);
    expect(fetches).toHaveLength(2);
});

const readState = (snapshot: Atom.Writable<DrainerSnapshotInterface>) => readSnapshot(snapshot).state;

const failing: Row = Effect.die(new Error('boom'));

const advance = (millis: number) => TestClock.adjust(`${millis} millis`);

const provideLive = <A, E>(effect: Effect.Effect<A, E, ResidencyTestService | Workload | Db | Scope.Scope>) =>
    effect.pipe(Effect.scoped, Effect.provide(testLayer));

const provide = <A, E>(effect: Effect.Effect<A, E, ResidencyTestService | Workload | Db | Scope.Scope>) =>
    effect.pipe(
        Effect.ensuring(advance(1)),
        Effect.scoped,
        Effect.provide(testLayer),
        Effect.ensuring(
            Effect.sync(() => {
                appState.currentState = 'active';
                residency.isModelReady = true;
            })
        )
    );

describe('DrainerService state transitions', () => {
    it.effect('keeps a user pause when the drainer is stopped', () =>
        Effect.gen(function* () {
            const { snapshot, drainer } = yield* makeHarness();
            yield* drainer.pause();
            yield* drainer.stop();

            expect(readState(snapshot)).toBe(DrainerStateEnum.PAUSED);
        }).pipe(provide)
    );

    it.live('gives a boost started from ERROR a fresh failure budget', () =>
        Effect.gen(function* () {
            const { snapshot, drainer } = yield* makeHarness({
                rows: call => {
                    if (call === 1) {
                        return Array.from({ length: 5 }, () => failing);
                    }
                    if (call === 2) {
                        return [failing];
                    }

                    return [];
                }
            });
            yield* drainer.start();
            yield* drainer.boost();
            expect(readState(snapshot)).toBe(DrainerStateEnum.ERROR);

            yield* drainer.boost();
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
        }).pipe(provideLive)
    );
});

describe('DrainerService relaxed polling', () => {
    it.effect('polls with the relaxed batch size one relaxed interval after each batch settles while work is pending', () =>
        Effect.gen(function* () {
            const { drainer, fetches } = yield* makeHarness({ pending: 3, rows: () => [Effect.void] });
            yield* drainer.start();
            yield* advance(999);
            expect(fetches).toEqual([]);
            yield* advance(1);
            expect(fetches).toEqual([5]);
            yield* advance(1000);
            expect(fetches).toEqual([5]);
            yield* advance(1);
            expect(fetches).toEqual([5, 5]);
        }).pipe(provide)
    );

    it.effect('polls every 10 seconds when nothing is pending', () =>
        Effect.gen(function* () {
            const { drainer, fetches } = yield* makeHarness();
            yield* drainer.start();
            yield* advance(9999);
            expect(fetches).toEqual([]);
            yield* advance(1);
            expect(fetches).toEqual([5]);
            yield* advance(10_000);
            expect(fetches).toEqual([5]);
            yield* advance(1);
            expect(fetches).toEqual([5, 5]);
        }).pipe(provide)
    );

    it.effect('switches to the idle interval once a batch leaves nothing pending', () =>
        Effect.gen(function* () {
            const { drainer, fetches, counter } = yield* makeHarness({ pending: 3, rows: () => [Effect.void] });
            yield* drainer.start();
            counter.pending = 0;
            yield* advance(1000);
            expect(fetches).toHaveLength(1);
            yield* advance(10_000);
            expect(fetches).toHaveLength(1);
            yield* advance(1);
            expect(fetches).toHaveLength(2);
        }).pipe(provide)
    );

    it.effect('refreshes the pending count on start and after every batch', () =>
        Effect.gen(function* () {
            const { drainer, counter, snapshot } = yield* makeHarness({ pending: 3, rows: () => [Effect.void] });
            counter.pending = 7;
            yield* drainer.start();
            expect(readSnapshot(snapshot).pending).toBe(7);
            counter.pending = 2;
            yield* advance(1000);
            expect(readSnapshot(snapshot).pending).toBe(2);
        }).pipe(provide)
    );

    it.effect('waits 30 seconds before the next poll when the model is not ready', () =>
        Effect.gen(function* () {
            residency.isModelReady = false;
            const { drainer, fetches } = yield* makeHarness({ pending: 3, rows: () => [Effect.void] });
            yield* drainer.start();
            yield* advance(1000);
            expect(fetches).toHaveLength(1);
            yield* advance(30_000);
            expect(fetches).toHaveLength(1);
            yield* advance(1);
            expect(fetches).toHaveLength(2);
        }).pipe(provide)
    );

    it.effect('does not poll before start or after stop, and polls again after a restart', () =>
        Effect.gen(function* () {
            const { drainer, fetches, snapshot } = yield* makeHarness({ pending: 3 });
            yield* drainer.schedule();
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            yield* drainer.start();
            yield* drainer.stop();
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
            yield* drainer.start();
            yield* advance(1000);
            expect(fetches).toHaveLength(1);
        }).pipe(provide)
    );

    it.effect('halts until scheduled again', () =>
        Effect.gen(function* () {
            const { drainer, fetches } = yield* makeHarness({ pending: 3 });
            yield* drainer.start();
            yield* drainer.halt();
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            yield* drainer.schedule();
            yield* advance(1000);
            expect(fetches).toHaveLength(1);
        }).pipe(provide)
    );

    it.effect('only polls while the app is active', () =>
        Effect.gen(function* () {
            const { drainer, fetches } = yield* makeHarness({ pending: 3 });
            yield* drainer.start();
            appState.currentState = 'background';
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            appState.currentState = 'active';
            yield* drainer.schedule();
            yield* advance(1000);
            expect(fetches).toHaveLength(1);
        }).pipe(provide)
    );
});

describe('DrainerService foreground gating', () => {
    it.effect('stops polling while foreground work runs and resumes after it ends', () =>
        Effect.gen(function* () {
            const { drainer, fetches, setForegroundBusy } = yield* makeHarness({ pending: 3 });
            yield* drainer.start();
            yield* setForegroundBusy(true);
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            yield* drainer.schedule();
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            yield* setForegroundBusy(false);
            yield* advance(999);
            expect(fetches).toEqual([]);
            yield* advance(1);
            expect(fetches).toHaveLength(1);
        }).pipe(provide)
    );
});

describe('DrainerService failures', () => {
    it.effect('enters ERROR after five consecutive row failures and auto-retries after 30 seconds', () =>
        Effect.gen(function* () {
            const { fetches, snapshot } = yield* startFailingDrainer(6);
            expect(readSnapshot(snapshot)).toMatchObject({ state: DrainerStateEnum.ERROR, errorMessage: 'boom' });
            yield* advance(29_999);
            expect(fetches).toHaveLength(1);
            expect(readState(snapshot)).toBe(DrainerStateEnum.ERROR);
            yield* advance(1);
            yield* expectRecoveredAndPolling(snapshot, fetches);
        }).pipe(provide)
    );

    it.effect('resets the failure budget on a successful row and ignores SQLITE_BUSY failures', () =>
        Effect.gen(function* () {
            const busy: Row = Effect.die(new Error('database is locked'));
            const { drainer, snapshot, fetches } = yield* makeHarness({
                pending: 3,
                rows: call =>
                    call === 1 ? [failing, failing, failing, failing, Effect.void] : [failing, busy, busy, busy, failing, failing]
            });
            yield* drainer.start();
            yield* advance(1000);
            yield* advance(1001);
            expect(fetches).toHaveLength(2);
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
        }).pipe(provide)
    );

    it.effect('retry clears ERROR immediately and polls again', () =>
        Effect.gen(function* () {
            const { drainer, fetches, snapshot } = yield* startFailingDrainer(5);
            expect(readState(snapshot)).toBe(DrainerStateEnum.ERROR);
            yield* drainer.retry();
            yield* expectRecoveredAndPolling(snapshot, fetches);
        }).pipe(provide)
    );
});

describe('DrainerService boost', () => {
    it.effect('drains boost batches until empty, then returns to relaxed polling', () =>
        Effect.gen(function* () {
            const { drainer, fetches, snapshot } = yield* makeHarness({
                pending: 3,
                rows: call => (call <= 2 ? [Effect.void, Effect.void, Effect.void] : [])
            });
            yield* drainer.start();
            const boosting = yield* Effect.forkChild(drainer.boost());
            yield* advance(1);
            yield* Fiber.await(boosting);
            expect(fetches).toEqual([3, 3, 3]);
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
            yield* advance(1000);
            expect(fetches).toEqual([3, 3, 3, 5]);
        }).pipe(provide)
    );

    it.effect('reports BOOSTING while boosting and stops between rows when the boost is cancelled', () =>
        Effect.gen(function* () {
            const { drainer, snapshot, processed, gated, boosting } = yield* startGatedBoost();
            expect(readState(snapshot)).toBe(DrainerStateEnum.BOOSTING);
            drainer.cancelBoost();
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
            yield* gated.open;
            yield* advance(1);
            yield* Fiber.await(boosting);
            expect(processed).toEqual([1]);
        }).pipe(provide)
    );

    it.effect('ignores a boost while already boosting', () =>
        Effect.gen(function* () {
            const gated = yield* makeGatedRow(() => undefined);
            const { drainer, fetches } = yield* makeHarness({ pending: 3, rows: call => (call === 1 ? [gated.row] : []) });
            yield* drainer.start();
            const boosting = yield* Effect.forkChild(drainer.boost());
            yield* gated.started;
            yield* drainer.boost();
            yield* gated.open;
            yield* advance(1);
            yield* Fiber.await(boosting);
            expect(fetches).toEqual([3, 3]);
        }).pipe(provide)
    );

    it.effect('skips polling while another drainer holds the shared drain lock and retries one second later', () =>
        Effect.gen(function* () {
            const gated = yield* makeGatedRow(() => undefined);
            const holder = yield* makeHarness({ pending: 3, rows: call => (call === 1 ? [gated.row] : []) });
            const waiter = yield* makeHarness({ pending: 3, relaxedIntervalMs: 5000, rows: () => [Effect.void] });
            yield* holder.drainer.start();
            yield* waiter.drainer.start();
            const boosting = yield* Effect.forkChild(holder.drainer.boost());
            yield* gated.started;
            yield* advance(6500);
            expect(waiter.fetches).toEqual([]);
            yield* gated.open;
            yield* advance(1);
            yield* Fiber.await(boosting);
            yield* advance(499);
            expect(waiter.fetches).toEqual([5]);
        }).pipe(provide)
    );
});

describe('DrainerService pause', () => {
    it.effect('pauses polling, ignores schedule while paused, and resumes polling', () =>
        Effect.gen(function* () {
            const { drainer, fetches, snapshot } = yield* makeHarness({ pending: 3 });
            yield* drainer.start();
            yield* drainer.pause();
            expect(readState(snapshot)).toBe(DrainerStateEnum.PAUSED);
            yield* drainer.schedule();
            yield* advance(20_000);
            expect(fetches).toEqual([]);
            yield* drainer.resume();
            expect(readState(snapshot)).toBe(DrainerStateEnum.IDLE);
            yield* advance(1000);
            expect(fetches).toHaveLength(1);
        }).pipe(provide)
    );

    it.effect('pause cancels a running boost and waits for its current row', () =>
        Effect.gen(function* () {
            const { drainer, snapshot, processed, gated, boosting } = yield* startGatedBoost();
            const pausing = yield* Effect.forkChild(drainer.pause());
            yield* Effect.yieldNow;
            expect(pausing.pollUnsafe()).toBeUndefined();
            yield* gated.open;
            yield* advance(1);
            yield* Fiber.await(pausing);
            yield* Fiber.await(boosting);
            expect(processed).toEqual([1]);
            expect(readState(snapshot)).toBe(DrainerStateEnum.PAUSED);
        }).pipe(provide)
    );
});
