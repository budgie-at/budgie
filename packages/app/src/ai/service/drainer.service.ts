import { YIELD_TO_UI } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FiberHandle from 'effect/FiberHandle';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { AppState } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerConfigInterface } from '../interface/drainer-config.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { patchAtom } from '../utils/patch-atom.util';

import type { AiModelResidencyService } from './ai-model-residency.service';
import type { Db } from '@budgie/contracts';
import type * as Context from 'effect/Context';

export const makeDrainer = Effect.fnUntraced(function* <E>(
    config: DrainerConfigInterface<E>,
    modelResidency: Context.Service.Shape<typeof AiModelResidencyService>
) {
    const workload = yield* Workload;
    const loop = yield* FiberHandle.make();
    const retryTimer = yield* FiberHandle.make();
    const foregroundWatch = yield* FiberHandle.make();
    const batchLock = yield* Semaphore.make(1);
    const isStarted = yield* Ref.make(false);
    const consecutiveFailures = yield* Ref.make(0);
    const { snapshot } = config;
    const maxConsecutiveFailures = 5;
    const progressRefreshEvery = 25;
    const idleIntervalMs = 10_000;
    const drainLockBusyRescheduleMs = 1_000;
    const errorAutoRetryMs = 30_000;
    const sqliteBusyPattern = /database is locked|SQLITE_BUSY/iu;
    const blockedStates = new Set([DrainerStateEnum.BOOSTING, DrainerStateEnum.PAUSED, DrainerStateEnum.ERROR]);

    const readState = (): DrainerStateEnum => appAtomRegistry.get(snapshot).state;

    const relaxedDelay = (): number => (appAtomRegistry.get(snapshot).pending === 0 ? idleIntervalMs : config.relaxedIntervalMs);

    const isSafe = Effect.gen(function* () {
        const isForegroundIdle = (yield* SubscriptionRef.get(workload.foregroundCount)) === 0;

        return (yield* Ref.get(isStarted)) && AppState.currentState === 'active' && isForegroundIdle;
    });

    const canSchedule = Effect.map(isSafe, safe => safe && !blockedStates.has(readState()));

    const isBoosting = Effect.map(isSafe, safe => safe && readState() === DrainerStateEnum.BOOSTING);

    const halt = Effect.fn('Drainer.halt')(function* () {
        yield* FiberHandle.run(loop, Effect.interrupt);
    });

    const whenIdle = Effect.fn('Drainer.whenIdle')(function* () {
        yield* batchLock.withPermit(Effect.void);
    });

    const cancelBoost = (): void => {
        if (readState() === DrainerStateEnum.BOOSTING) {
            patchAtom(snapshot, { state: DrainerStateEnum.IDLE });
        }
    };

    const refreshPending = Effect.ignore(
        Effect.gen(function* () {
            patchAtom(snapshot, { pending: yield* config.countPending });
        })
    );

    const finalizeBatch = Effect.ignore(config.afterBatch).pipe(Effect.andThen(refreshPending), Effect.andThen(YIELD_TO_UI));

    const withModel = (use: Effect.Effect<void, E, Db>): Effect.Effect<boolean, E, Db> =>
        Effect.acquireUseRelease(
            modelResidency.acquire(config.subsystem),
            isReady => (isReady ? Effect.as(use, true) : Effect.succeed(false)),
            () => modelResidency.release(config.subsystem)
        );

    const runRow = Effect.fnUntraced(function* (row: Effect.Effect<void, E, Db>, retry: Effect.Effect<void, never, Db>) {
        const exit = yield* Effect.exit(row);
        if (Exit.isSuccess(exit)) {
            yield* Ref.set(consecutiveFailures, 0);

            return;
        }
        const message = exit.cause.pipe(Cause.squash, getRootErrorMessage);
        if (sqliteBusyPattern.test(message)) {
            return;
        }
        if ((yield* Ref.updateAndGet(consecutiveFailures, failures => failures + 1)) < maxConsecutiveFailures) {
            return;
        }
        patchAtom(snapshot, { state: DrainerStateEnum.ERROR, errorMessage: message });
        yield* FiberHandle.run(
            retryTimer,
            Effect.delay(
                Effect.suspend(() => (readState() === DrainerStateEnum.ERROR ? retry : Effect.void)),
                errorAutoRetryMs
            )
        );
    });

    const processRows = Effect.fnUntraced(function* (rows: Effect.Effect<void, E, Db>[], retry: Effect.Effect<void, never, Db>) {
        for (const row of rows) {
            if (!(yield* isSafe) || readState() === DrainerStateEnum.ERROR) {
                return;
            }
            yield* runRow(row, retry);
        }
    });

    const relaxedTick = Effect.fn('Drainer.relaxedTick')(function* (retry: Effect.Effect<void, never, Db>) {
        const outcome = yield* modelResidency.drainLock.withPermitsIfAvailable(1)(
            config.fetchPending(config.relaxedBatchSize).pipe(
                Effect.flatMap(rows => (isEmptyArray(rows) ? Effect.succeed(true) : withModel(processRows(rows, retry)))),
                Effect.tapCause(Effect.logError),
                Effect.orElseSucceed(() => true),
                Effect.ensuring(finalizeBatch)
            )
        );

        return Option.match(outcome, {
            onNone: () => drainLockBusyRescheduleMs,
            onSome: isReady => (isReady ? relaxedDelay() : errorAutoRetryMs)
        });
    });

    const drain = Effect.fn('Drainer.drain')(function* (retry: Effect.Effect<void, never, Db>) {
        let delay = relaxedDelay();
        while (yield* canSchedule) {
            yield* Effect.sleep(delay);
            yield* waitForIdle;
            if (!(yield* canSchedule)) {
                return;
            }
            delay = yield* Effect.uninterruptible(batchLock.withPermit(relaxedTick(retry)));
        }
    });

    const retry = Effect.fn('Drainer.retry')(function* (): Effect.fn.Return<void, never, Db> {
        yield* Ref.set(consecutiveFailures, 0);
        patchAtom(snapshot, { state: DrainerStateEnum.IDLE, errorMessage: null });
        if (yield* canSchedule) {
            yield* FiberHandle.run(loop, drain(retry()));
        }
    });

    const schedule = Effect.fn('Drainer.schedule')(function* () {
        if (yield* canSchedule) {
            yield* FiberHandle.run(loop, drain(retry()));
        }
    });

    const boostRows = Effect.fnUntraced(function* () {
        let processed = 0;
        while (yield* isBoosting) {
            const rows = yield* config.fetchPending(config.boostBatchSize);
            if (isEmptyArray(rows)) {
                return;
            }
            for (const row of rows) {
                if (!(yield* isBoosting)) {
                    return;
                }
                yield* runRow(row, retry());
                processed += 1;
                yield* processed % config.yieldEveryRows === 0 ? YIELD_TO_UI : Effect.void;
                yield* processed % progressRefreshEvery === 0 ? refreshPending : Effect.void;
            }
        }
    });

    const runBoost = Effect.fn('Drainer.runBoost')(function* () {
        yield* Ref.set(consecutiveFailures, 0);
        patchAtom(snapshot, { state: DrainerStateEnum.BOOSTING, errorMessage: null });
        yield* withModel(boostRows()).pipe(Effect.ensuring(finalizeBatch));
    });

    const finishBoost = Effect.fn('Drainer.finishBoost')(function* () {
        cancelBoost();
        yield* schedule();
    });

    return {
        snapshot,
        fetchPending: config.fetchPending,
        whenIdle,
        halt,
        schedule,
        retry,
        cancelBoost,
        start: Effect.fn('Drainer.start')(function* () {
            if (yield* Ref.getAndSet(isStarted, true)) {
                return;
            }
            yield* FiberHandle.run(
                foregroundWatch,
                Stream.runForEach(SubscriptionRef.changes(workload.foregroundCount), count => (count > 0 ? halt() : schedule()))
            );
            yield* schedule();
            yield* refreshPending;
        }),
        stop: Effect.fn('Drainer.stop')(function* () {
            yield* Ref.set(isStarted, false);
            yield* halt();
            yield* FiberHandle.clear(retryTimer);
            yield* FiberHandle.clear(foregroundWatch);
            if (readState() !== DrainerStateEnum.PAUSED) {
                patchAtom(snapshot, { state: DrainerStateEnum.IDLE });
            }
        }),
        pause: Effect.fn('Drainer.pause')(function* () {
            if (readState() === DrainerStateEnum.PAUSED) {
                return;
            }
            cancelBoost();
            yield* halt();
            yield* FiberHandle.clear(retryTimer);
            yield* whenIdle();
            patchAtom(snapshot, { state: DrainerStateEnum.PAUSED });
        }),
        resume: Effect.fn('Drainer.resume')(function* () {
            if (readState() !== DrainerStateEnum.PAUSED) {
                return;
            }
            patchAtom(snapshot, { state: DrainerStateEnum.IDLE });
            yield* schedule();
            yield* refreshPending;
        }),
        boost: Effect.fn('Drainer.boost')(function* () {
            if (readState() === DrainerStateEnum.BOOSTING) {
                return;
            }
            yield* halt();
            yield* batchLock.withPermit(Effect.ensuring(modelResidency.drainLock.withPermitsIfAvailable(1)(runBoost()), finishBoost()));
        })
    };
});
