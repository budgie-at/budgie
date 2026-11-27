import { SyncEntityTable, SyncRepository, logAndContinue } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import { t } from '@lingui/core/macro';
import { getTableName } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import { AppState } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BackgroundSyncModule } from '../../../modules/background-sync';
import { appStateChanges } from '../../@generic/constant/app-state-changes.constant';
import { Workload } from '../../@generic/service/workload.service';

import type { SyncEntityInterface } from '@budgie/contracts';

export class BackgroundSyncSessionService extends Context.Service<BackgroundSyncSessionService>()(
    '@budgie/app/BackgroundSyncSessionService',
    {
        make: Effect.gen(function* () {
            const reactivity = yield* Reactivity.Reactivity;
            const syncRepository = yield* SyncRepository;
            const workload = yield* Workload;

            const [activeRef, startedRef, progressRef, updateSemaphore] = yield* Effect.all([
                Ref.make(false),
                Ref.make(false),
                Ref.make<{
                    readonly completedBatches: number;
                    readonly positions: ReadonlyMap<number, number | null>;
                }>({
                    completedBatches: 0,
                    positions: new Map()
                }),
                Semaphore.make(1)
            ]);

            const countAdvancedBatches = (
                previousPositions: ReadonlyMap<number, number | null>,
                nextPositions: ReadonlyMap<number, number | null>
            ): number => {
                let advancedCount = 0;

                for (const [id, previousPosition] of previousPositions) {
                    if (nextPositions.get(id) !== previousPosition) {
                        advancedCount += 1;
                    }
                }

                return advancedCount;
            };

            const toNativeProgress = (
                syncs: readonly SyncEntityInterface[],
                completedBatches: number
            ): { readonly completed: number; readonly total: number } => {
                const initialProgress = resolveInitialSyncProgress(syncs);

                if (isDefined(initialProgress?.percent)) {
                    return { completed: initialProgress.percent, total: 100 };
                }

                return { completed: completedBatches, total: 0 };
            };

            const observeNativeExpire = (nativeModule: NonNullable<typeof BackgroundSyncModule>): Stream.Stream<boolean> =>
                Stream.callback<boolean>(queue =>
                    Effect.acquireRelease(
                        Effect.sync(() =>
                            nativeModule.addListener('onExpire', () => {
                                Queue.offerUnsafe(queue, true);
                            })
                        ),
                        subscription =>
                            Effect.sync(() => {
                                subscription.remove();
                            })
                    )
                );

            const resolveProgress = (syncs: readonly SyncEntityInterface[]) =>
                Ref.updateAndGet(progressRef, previous => {
                    const nextPositions = new Map(syncs.map(sync => [sync.id, sync.backwardSyncFromAt?.getTime() ?? null]));

                    return {
                        completedBatches: previous.completedBatches + countAdvancedBatches(previous.positions, nextPositions),
                        positions: nextPositions
                    };
                }).pipe(Effect.map(({ completedBatches }) => toNativeProgress(syncs, completedBatches)));

            const interruptIfBackground = Effect.suspend(() =>
                AppState.currentState === 'active' ? Effect.void : workload.interruptBackground
            );

            const stopSession = (nativeModule: NonNullable<typeof BackgroundSyncModule>) =>
                Effect.gen(function* () {
                    yield* Ref.set(progressRef, { completedBatches: 0, positions: new Map() });
                    yield* Effect.promise(() => nativeModule.stop());
                    const wasActive = yield* Ref.getAndSet(activeRef, false);
                    if (wasActive) {
                        yield* interruptIfBackground;
                    }

                    return false;
                });

            const syncSession = (syncs: readonly SyncEntityInterface[], forceRestart: boolean) =>
                updateSemaphore.withPermit(
                    Effect.gen(function* () {
                        const nativeModule = BackgroundSyncModule;
                        if (!isDefined(nativeModule)) {
                            yield* Ref.set(activeRef, false);

                            return false;
                        }

                        if (!isNotEmptyArray(syncs)) {
                            return yield* stopSession(nativeModule);
                        }

                        const { completed, total } = yield* resolveProgress(syncs);
                        const isActive = yield* Effect.promise(() =>
                            nativeModule.update(
                                t`Syncing bank history`,
                                t`Your transactions keep importing in the background`,
                                completed,
                                total,
                                forceRestart
                            )
                        );
                        yield* Ref.set(activeRef, isActive);

                        return isActive;
                    })
                );

            const ensureActive = Effect.fn('BackgroundSyncSessionService.ensureActive')(function* (forceRestart: boolean = false) {
                const syncs = yield* syncRepository.getAllPendingBackwardSyncs;

                return yield* syncSession(syncs, forceRestart);
            });

            const handleExpire = Effect.flatMap(Ref.getAndSet(activeRef, false), wasActive =>
                wasActive ? interruptIfBackground : Effect.void
            );

            return {
                ensureActive,
                isActive: Ref.get(activeRef),
                start: Effect.fn('BackgroundSyncSessionService.start')(function* () {
                    const nativeModule = BackgroundSyncModule;
                    if (!isDefined(nativeModule)) {
                        return;
                    }

                    const alreadyStarted = yield* Ref.getAndSet(startedRef, true);
                    if (alreadyStarted) {
                        return;
                    }

                    yield* observeNativeExpire(nativeModule).pipe(
                        Stream.runForEach(() => handleExpire),
                        logAndContinue,
                        Effect.forkDetach
                    );

                    yield* appStateChanges.pipe(
                        Stream.filter(state => state === 'active'),
                        Stream.runForEach(() => logAndContinue(ensureActive(true))),
                        logAndContinue,
                        Effect.forkDetach
                    );

                    yield* reactivity.stream([getTableName(SyncEntityTable)], syncRepository.getAllPendingBackwardSyncs).pipe(
                        Stream.runForEach(syncs => logAndContinue(syncSession(syncs, false))),
                        logAndContinue,
                        Effect.forkDetach
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(BackgroundSyncSessionService, BackgroundSyncSessionService.make).pipe(
        Layer.provide([SyncRepository.layer, Workload.layer])
    );
}
