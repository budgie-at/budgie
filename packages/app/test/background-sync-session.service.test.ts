import { SyncRepository } from '@budgie/contracts';
import { beforeEach, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vitest';

import { Workload } from '../src/@generic/service/workload.service';
import { BackgroundSyncSessionService } from '../src/sync/service/background-sync-session.service';

import { buildPendingSync } from './fixture/build-pending-sync';
import { inertDbLayer } from './fixture/inert-db-layer';

import type { SyncEntityInterface } from '@budgie/contracts';

const nativeState = vi.hoisted(() => {
    const expireListeners = new Set<() => void>();
    const appStateListeners = new Set<(state: string) => void>();

    return {
        expireListeners,
        appStateListeners,
        appState: {
            currentState: 'active',
            addEventListener: vi.fn((_event: string, listener: (state: string) => void) => {
                appStateListeners.add(listener);

                return {
                    remove: vi.fn(() => {
                        appStateListeners.delete(listener);
                    })
                };
            })
        },
        backgroundSyncModule: {
            update: vi.fn((_title: string, _subtitle: string, _completed: number, _total: number, _forceRestart: boolean) =>
                Promise.resolve(true)
            ),
            stop: vi.fn(() => Promise.resolve(undefined)),
            addListener: vi.fn((event: string, listener: () => void) => {
                if (event === 'onExpire') {
                    expireListeners.add(listener);
                }

                return {
                    remove: vi.fn(() => {
                        expireListeners.delete(listener);
                    })
                };
            })
        }
    };
});

vi.mock('../modules/background-sync', () => ({ BackgroundSyncModule: nativeState.backgroundSyncModule }));
vi.mock('react-native', () => ({ AppState: nativeState.appState }));
vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));

const state = {
    pendingSyncs: [] as SyncEntityInterface[],
    interruptBackgroundCalls: 0
};

const expectNativeSessionRestarted = () => {
    expect(nativeState.backgroundSyncModule.update).toHaveBeenCalledWith(
        'Syncing bank history',
        'Your transactions keep importing in the background',
        0,
        0,
        true
    );
};

const workloadSpyLayer = Layer.effect(
    Workload,
    Effect.gen(function* () {
        const realWorkload = yield* Workload;

        return Workload.of({
            ...realWorkload,
            interruptBackground: Effect.tap(realWorkload.interruptBackground, () =>
                Effect.sync(() => {
                    state.interruptBackgroundCalls += 1;
                })
            )
        });
    })
).pipe(Layer.provide(Workload.layer));

const syncRepositoryLayer = Layer.mock(SyncRepository)({
    getAllPendingBackwardSyncs: Effect.sync(() => [...state.pendingSyncs])
});

const baseLayer = Layer.mergeAll(Reactivity.layer, syncRepositoryLayer, workloadSpyLayer).pipe(
    Layer.provideMerge(Layer.mergeAll(inertDbLayer, FetchHttpClient.layer))
);

const makeTestLayer = () =>
    Layer.effect(BackgroundSyncSessionService, BackgroundSyncSessionService.make).pipe(Layer.provideMerge(baseLayer));

const waitUntil = Effect.fnUntraced(function* (predicate: Effect.Effect<boolean>) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
        if (yield* predicate) {
            return;
        }

        yield* TestClock.withLive(Effect.sleep(5));
    }
});

describe('BackgroundSyncSessionService', () => {
    beforeEach(() => {
        state.pendingSyncs = [];
        state.interruptBackgroundCalls = 0;
        nativeState.appState.currentState = 'active';
        nativeState.expireListeners.clear();
        nativeState.appStateListeners.clear();
        nativeState.backgroundSyncModule.update.mockReset();
        nativeState.backgroundSyncModule.update.mockImplementation(() => Promise.resolve(true));
        nativeState.backgroundSyncModule.stop.mockReset();
        nativeState.backgroundSyncModule.stop.mockImplementation(() => Promise.resolve(undefined));
        nativeState.backgroundSyncModule.addListener.mockClear();
        nativeState.appState.addEventListener.mockClear();
    });

    it.effect('starts an indeterminate native session on ensureActive(true) for pending FULL backward sync', () =>
        Effect.gen(function* () {
            state.pendingSyncs = [buildPendingSync({ backwardSyncLimitAt: null })];
            const session = yield* BackgroundSyncSessionService;

            const isActive = yield* session.ensureActive(true);

            expect(isActive).toBe(true);
            expect(yield* session.isActive).toBe(true);
            expectNativeSessionRestarted();
        }).pipe(Effect.provide(makeTestLayer()))
    );

    it.effect('computes determinate percentage progress for bounded depth backward sync', () =>
        Effect.gen(function* () {
            const forwardSyncFromAt = new Date('2026-06-01T00:00:00.000Z');
            const backwardSyncLimitAt = new Date('2026-05-01T00:00:00.000Z');
            const backwardSyncFromAt = new Date((forwardSyncFromAt.getTime() + backwardSyncLimitAt.getTime()) / 2);
            state.pendingSyncs = [buildPendingSync({ forwardSyncFromAt, backwardSyncLimitAt, backwardSyncFromAt })];
            const session = yield* BackgroundSyncSessionService;

            yield* session.ensureActive(false);

            expect(nativeState.backgroundSyncModule.update).toHaveBeenCalledTimes(1);
            const [[, , completed, total, forceRestart]] = nativeState.backgroundSyncModule.update.mock.calls;
            expect(total).toBe(100);
            expect(completed).toBeGreaterThan(0);
            expect(completed).toBeLessThan(100);
            expect(forceRestart).toBe(false);
        }).pipe(Effect.provide(makeTestLayer()))
    );

    it.effect('tracks real batch advancement for FULL sync without falsely incrementing on status updates', () =>
        Effect.gen(function* () {
            const firstCursor = new Date('2026-06-01T00:00:00.000Z');
            const secondCursor = new Date('2026-05-01T00:00:00.000Z');
            state.pendingSyncs = [buildPendingSync({ backwardSyncFromAt: firstCursor, backwardSyncLimitAt: null })];
            const session = yield* BackgroundSyncSessionService;

            yield* session.ensureActive(false);
            yield* session.ensureActive(false);

            state.pendingSyncs = [buildPendingSync({ backwardSyncFromAt: secondCursor, backwardSyncLimitAt: null })];
            yield* session.ensureActive(false);

            expect(nativeState.backgroundSyncModule.update.mock.calls[0]?.[2]).toBe(0);
            expect(nativeState.backgroundSyncModule.update.mock.calls[1]?.[2]).toBe(0);
            expect(nativeState.backgroundSyncModule.update.mock.calls[2]?.[2]).toBe(1);
        }).pipe(Effect.provide(makeTestLayer()))
    );

    it.effect('stops native session when pending backward syncs become empty and interrupts background only if previously active', () =>
        Effect.gen(function* () {
            const session = yield* BackgroundSyncSessionService;

            state.pendingSyncs = [buildPendingSync()];
            yield* session.ensureActive(true);
            expect(yield* session.isActive).toBe(true);

            nativeState.appState.currentState = 'background';
            state.pendingSyncs = [];
            yield* session.ensureActive(false);

            expect(nativeState.backgroundSyncModule.stop).toHaveBeenCalledTimes(1);
            expect(yield* session.isActive).toBe(false);
            expect(state.interruptBackgroundCalls).toBe(1);

            yield* session.ensureActive(false);

            expect(nativeState.backgroundSyncModule.stop).toHaveBeenCalledTimes(2);
            expect(yield* session.isActive).toBe(false);
            expect(state.interruptBackgroundCalls).toBe(1);
        }).pipe(Effect.provide(makeTestLayer()))
    );

    it.effect('handles native onExpire in the background by deactivating and interrupting background workload', () =>
        Effect.gen(function* () {
            state.pendingSyncs = [buildPendingSync()];
            const session = yield* BackgroundSyncSessionService;

            yield* session.start();
            yield* waitUntil(session.isActive);
            expect(yield* session.isActive).toBe(true);

            nativeState.appState.currentState = 'background';
            nativeState.expireListeners.forEach(listener => void listener());
            yield* waitUntil(Effect.map(session.isActive, isActive => !isActive));

            expect(yield* session.isActive).toBe(false);
            expect(state.interruptBackgroundCalls).toBe(1);
        }).pipe(Effect.provide(makeTestLayer()))
    );

    it.effect('restarts native session with forceRestart on foreground resume after onExpire when pending syncs remain', () =>
        Effect.gen(function* () {
            state.pendingSyncs = [buildPendingSync()];
            const session = yield* BackgroundSyncSessionService;

            yield* session.start();
            yield* waitUntil(session.isActive);

            nativeState.appState.currentState = 'background';
            nativeState.expireListeners.forEach(listener => void listener());
            yield* waitUntil(Effect.map(session.isActive, isActive => !isActive));

            nativeState.backgroundSyncModule.update.mockClear();
            nativeState.appState.currentState = 'active';
            nativeState.appStateListeners.forEach(listener => void listener('active'));
            yield* waitUntil(session.isActive);

            expect(yield* session.isActive).toBe(true);
            expectNativeSessionRestarted();
        }).pipe(Effect.provide(makeTestLayer()))
    );

    it.effect('interrupts background workload when native update flips active from true to false before onExpire', () =>
        Effect.gen(function* () {
            state.pendingSyncs = [buildPendingSync()];
            const session = yield* BackgroundSyncSessionService;

            yield* session.ensureActive(true);
            expect(yield* session.isActive).toBe(true);

            nativeState.appState.currentState = 'background';
            nativeState.backgroundSyncModule.update.mockResolvedValueOnce(false);
            const active = yield* session.ensureActive(false);

            expect(active).toBe(false);
            expect(yield* session.isActive).toBe(false);
            expect(state.interruptBackgroundCalls).toBe(1);
        }).pipe(Effect.provide(makeTestLayer()))
    );
});
