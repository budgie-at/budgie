import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FiberHandle from 'effect/FiberHandle';
import * as Option from 'effect/Option';
import * as Atom from 'effect/reactivity/Atom';
import * as Scope from 'effect/Scope';
import * as Semaphore from 'effect/Semaphore';
import { AppState } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerConfigInterface } from '../interface/drainer-config.interface';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import { getRootErrorMessage } from '../utils/get-root-error-message.util';
import { patchAtom } from '../utils/patch-atom.util';

import { aiModelResidencyService } from './ai-model-residency.service';

import type { Db } from '@budgie/contracts';

export class DrainerService<E> {
    private static readonly MAX_CONSECUTIVE_FAILURES = 5;
    private static readonly PROGRESS_REFRESH_EVERY = 25;
    private static readonly IDLE_INTERVAL_MS = 10_000;
    private static readonly MUTEX_BUSY_RESCHEDULE_MS = 1_000;
    private static readonly ERROR_AUTO_RETRY_MS = 30_000;
    private static readonly SQLITE_BUSY_PATTERN = /database is locked|SQLITE_BUSY/iu;
    private static readonly BLOCKED_STATES = [DrainerStateEnum.BOOSTING, DrainerStateEnum.PAUSED, DrainerStateEnum.ERROR];
    private static readonly mutex = Semaphore.makeUnsafe(1);

    readonly snapshot = Atom.keepAlive(
        Atom.make<DrainerSnapshotInterface>({ state: DrainerStateEnum.IDLE, pending: 0, errorMessage: null })
    );

    readonly whenIdle = Effect.fn('DrainerService.whenIdle')(function* (this: DrainerService<E>) {
        yield* this.batchLock.withPermit(Effect.void);
    });

    readonly start = Effect.fn('DrainerService.start')(function* (this: DrainerService<E>) {
        if (this.started) {
            return;
        }
        this.started = true;
        yield* this.schedule();
        yield* this.refreshPending();
    });

    readonly schedule = Effect.fn('DrainerService.schedule')(function* (this: DrainerService<E>): Effect.fn.Return<void, never, Db> {
        if (!this.canSchedule()) {
            return;
        }
        yield* FiberHandle.run(this.loop, this.drain());
    });

    readonly halt = Effect.fn('DrainerService.halt')(function* (this: DrainerService<E>) {
        yield* FiberHandle.run(this.loop, Effect.interrupt);
    });

    readonly stop = Effect.fn('DrainerService.stop')(function* (this: DrainerService<E>) {
        this.started = false;
        yield* this.halt();
        yield* FiberHandle.clear(this.retryTimer);
        patchAtom(this.snapshot, { state: DrainerStateEnum.IDLE });
    });

    readonly pause = Effect.fn('DrainerService.pause')(function* (this: DrainerService<E>) {
        if (this.state === DrainerStateEnum.PAUSED) {
            return;
        }
        this.cancelBoost();
        yield* this.halt();
        yield* FiberHandle.clear(this.retryTimer);
        yield* this.whenIdle();
        patchAtom(this.snapshot, { state: DrainerStateEnum.PAUSED });
    });

    readonly resume = Effect.fn('DrainerService.resume')(function* (this: DrainerService<E>) {
        if (this.state !== DrainerStateEnum.PAUSED) {
            return;
        }
        patchAtom(this.snapshot, { state: DrainerStateEnum.IDLE });
        yield* this.schedule();
        yield* this.refreshPending();
    });

    readonly setForegroundBusy = Effect.fn('DrainerService.setForegroundBusy')(function* (
        this: DrainerService<E>,
        isForegroundBusy: boolean
    ) {
        this.isForegroundBusy = isForegroundBusy;
        if (isForegroundBusy) {
            yield* this.halt();

            return;
        }
        yield* this.schedule();
    });

    readonly boost = Effect.fn('DrainerService.boost')(function* (this: DrainerService<E>) {
        if (this.state === DrainerStateEnum.BOOSTING) {
            return;
        }
        yield* this.halt();
        yield* this.batchLock.withPermit(
            Effect.ensuring(DrainerService.mutex.withPermitsIfAvailable(1)(this.runBoost()), this.finishBoost())
        );
    });

    readonly retry = Effect.fn('DrainerService.retry')(function* (this: DrainerService<E>): Effect.fn.Return<void, never, Db> {
        this.consecutiveFailures = 0;
        patchAtom(this.snapshot, { state: DrainerStateEnum.IDLE, errorMessage: null });
        yield* this.schedule();
    });

    private readonly drain = Effect.fn('DrainerService.drain')(function* (this: DrainerService<E>) {
        let delay = this.relaxedDelay();
        while (this.canSchedule()) {
            yield* Effect.sleep(delay);
            yield* waitForIdle;
            if (!this.canSchedule()) {
                return;
            }
            delay = yield* Effect.uninterruptible(this.batchLock.withPermit(this.relaxedTick()));
        }
    });

    private readonly relaxedTick = Effect.fn('DrainerService.relaxedTick')(function* (this: DrainerService<E>) {
        const outcome = yield* DrainerService.mutex.withPermitsIfAvailable(1)(
            this.config.fetchPending(this.config.relaxedBatchSize).pipe(
                Effect.flatMap(rows => (isEmptyArray(rows) ? Effect.succeed(true) : this.withModel(this.processRows(rows)))),
                Effect.tapCause(Effect.logError),
                Effect.orElseSucceed(() => true),
                Effect.ensuring(this.finalizeBatch())
            )
        );

        return Option.match(outcome, {
            onNone: () => DrainerService.MUTEX_BUSY_RESCHEDULE_MS,
            onSome: isReady => (isReady ? this.relaxedDelay() : DrainerService.ERROR_AUTO_RETRY_MS)
        });
    });

    private readonly processRows = Effect.fnUntraced(function* (this: DrainerService<E>, rows: Effect.Effect<void, E, Db>[]) {
        for (const row of rows) {
            if (!this.isSafe() || this.state === DrainerStateEnum.ERROR) {
                return;
            }
            yield* this.runRow(row);
        }
    });

    private readonly runBoost = Effect.fn('DrainerService.runBoost')(function* (this: DrainerService<E>) {
        patchAtom(this.snapshot, { state: DrainerStateEnum.BOOSTING, errorMessage: null });
        yield* this.withModel(this.boostRows()).pipe(Effect.ensuring(this.finalizeBatch()));
    });

    private readonly boostRows = Effect.fnUntraced(function* (this: DrainerService<E>) {
        let processed = 0;
        while (this.isBoosting()) {
            const rows = yield* this.config.fetchPending(this.config.boostBatchSize);
            if (isEmptyArray(rows)) {
                return;
            }
            for (const row of rows) {
                if (!this.isBoosting()) {
                    return;
                }
                yield* this.runRow(row);
                processed += 1;
                yield* this.paceBoost(processed);
            }
        }
    });

    private readonly finishBoost = Effect.fn('DrainerService.finishBoost')(function* (this: DrainerService<E>) {
        if (this.state === DrainerStateEnum.BOOSTING) {
            patchAtom(this.snapshot, { state: DrainerStateEnum.IDLE });
        }
        yield* this.schedule();
    });

    private readonly runRow = Effect.fnUntraced(function* (this: DrainerService<E>, row: Effect.Effect<void, E, Db>) {
        const exit = yield* Effect.exit(row);
        if (Exit.isSuccess(exit)) {
            this.consecutiveFailures = 0;

            return;
        }
        const message = getRootErrorMessage(Cause.squash(exit.cause));
        if (DrainerService.SQLITE_BUSY_PATTERN.test(message)) {
            return;
        }
        this.consecutiveFailures += 1;
        if (this.consecutiveFailures < DrainerService.MAX_CONSECUTIVE_FAILURES) {
            return;
        }
        patchAtom(this.snapshot, { state: DrainerStateEnum.ERROR, errorMessage: message });
        yield* FiberHandle.run(this.retryTimer, Effect.delay(this.autoRetry(), DrainerService.ERROR_AUTO_RETRY_MS));
    });

    private readonly autoRetry = Effect.fn('DrainerService.autoRetry')(function* (this: DrainerService<E>) {
        if (this.state === DrainerStateEnum.ERROR) {
            yield* this.retry();
        }
    });

    private readonly finalizeBatch = Effect.fn('DrainerService.finalizeBatch')(function* (this: DrainerService<E>) {
        yield* Effect.ignore(this.config.afterBatch);
        yield* this.refreshPending();
        yield* YIELD_TO_UI;
    });

    private readonly refreshPending = Effect.fn('DrainerService.refreshPending')(
        function* (this: DrainerService<E>) {
            patchAtom(this.snapshot, { pending: yield* this.config.countPending });
        },
        effect => Effect.ignore(effect)
    );

    private readonly batchLock = Semaphore.makeUnsafe(1);
    private started = false;
    private isForegroundBusy = false;
    private consecutiveFailures = 0;
    private readonly loop = Effect.runSync(Scope.provide(FiberHandle.make(), Scope.makeUnsafe()));
    private readonly retryTimer = Effect.runSync(Scope.provide(FiberHandle.make(), Scope.makeUnsafe()));

    constructor(private readonly config: DrainerConfigInterface<E>) {}

    private get state(): DrainerStateEnum {
        return aiAtomRegistry.get(this.snapshot).state;
    }

    cancelBoost(): void {
        if (this.state === DrainerStateEnum.BOOSTING) {
            patchAtom(this.snapshot, { state: DrainerStateEnum.IDLE });
        }
    }

    private withModel(use: Effect.Effect<void, E, Db>): Effect.Effect<boolean, E, Db> {
        return Effect.acquireUseRelease(
            aiModelResidencyService.acquire(this.config.subsystem),
            isReady => (isReady ? Effect.as(use, true) : Effect.succeed(false)),
            () => aiModelResidencyService.release(this.config.subsystem)
        );
    }

    private paceBoost(processed: number): Effect.Effect<void, never, Db> {
        return Effect.andThen(
            processed % this.config.yieldEveryRows === 0 ? YIELD_TO_UI : Effect.void,
            processed % DrainerService.PROGRESS_REFRESH_EVERY === 0 ? this.refreshPending() : Effect.void
        );
    }

    private relaxedDelay(): number {
        return aiAtomRegistry.get(this.snapshot).pending === 0 ? DrainerService.IDLE_INTERVAL_MS : this.config.relaxedIntervalMs;
    }

    private isBoosting(): boolean {
        return this.isSafe() && this.state === DrainerStateEnum.BOOSTING;
    }

    private canSchedule(): boolean {
        return this.isSafe() && !DrainerService.BLOCKED_STATES.includes(this.state);
    }

    private isSafe(): boolean {
        return this.started && AppState.currentState === 'active' && !this.isForegroundBusy;
    }
}
