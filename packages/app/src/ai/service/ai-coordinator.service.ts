import { SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FiberHandle from 'effect/FiberHandle';
import * as FiberSet from 'effect/FiberSet';
import * as Layer from 'effect/Layer';
import * as Scope from 'effect/Scope';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { AppState } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { aiCoordinatorSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { EmbeddingProgressStore } from '../store/embedding-progress.store';
import { TranslationProgressStore } from '../store/translation-progress.store';
import { BACKGROUND_RELEASE_DELAY_MS } from '../utils/ai-constants.util';
import { patchAtom } from '../utils/patch-atom.util';

import { AiEmbeddingStatusService } from './ai-embedding-status.service';
import { AiModelResidencyService } from './ai-model-residency.service';
import { ChatService } from './chat.service';
import { EmbeddingDrainerService } from './embedding-drainer.service';
import { LocalEmbeddingService } from './embedding.service';
import { TranslationDrainerService } from './translation-drainer.service';

import type { Db } from '@budgie/contracts';
import type { AppStateStatus } from 'react-native';

export class AiCoordinatorService extends Context.Service<AiCoordinatorService>()('@budgie/app/AiCoordinatorService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const aiModelResidencyService = yield* AiModelResidencyService;
        const chatService = yield* ChatService;
        const localEmbeddingService = yield* LocalEmbeddingService;
        const embeddingDrainerService = yield* EmbeddingDrainerService;
        const aiEmbeddingStatusService = yield* AiEmbeddingStatusService;
        const translationDrainerService = yield* TranslationDrainerService;
        const translationProgressStore = yield* TranslationProgressStore;
        const embeddingProgressStore = yield* EmbeddingProgressStore;
        const settingsRepository = yield* SettingsRepository;
        const settleGraceMs = 5_000;
        const drainers = [translationDrainerService, ...embeddingDrainerService.drainers];
        const lifecycleLock = yield* Semaphore.make(1);
        const stopLock = yield* Semaphore.make(1);
        let activeScope: Scope.Closeable | null = null;

        const isActive = (): boolean => isDefined(activeScope) && !appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended;

        const isRuntimeEnabled = Effect.fnUntraced(function* () {
            const settings = yield* settingsRepository.getSettings();

            return (
                settings.isAiEnabled &&
                (settings.isAiVoiceInputEnabled || settings.isAiSuggestionsEnabled || settings.isAiTranslationsEnabled)
            );
        });

        const getEnabledDrainers = Effect.fnUntraced(function* () {
            const settings = yield* settingsRepository.getSettings();

            return [
                ...(settings.isAiTranslationsEnabled ? [translationDrainerService] : []),
                ...(settings.isAiSuggestionsEnabled ? embeddingDrainerService.drainers : [])
            ];
        });

        const startSubsystemsWhenIdle = Effect.fn('AiCoordinatorService.startSubsystemsWhenIdle')(function* () {
            yield* waitForIdle;
            if (!isActive()) {
                return;
            }
            const enabledDrainers = yield* getEnabledDrainers();
            yield* aiModelResidencyService.resume();
            yield* Effect.forEach(enabledDrainers, drainer => drainer.start(), { discard: true });
            if (enabledDrainers.includes(translationDrainerService)) {
                yield* translationProgressStore.refresh();
            }
            if (enabledDrainers.some(drainer => embeddingDrainerService.drainers.includes(drainer))) {
                yield* aiEmbeddingStatusService.migrateModel();
                yield* embeddingProgressStore.refresh();
            }
        });

        const stopSubsystems = Effect.fn('AiCoordinatorService.stopSubsystems')(() =>
            stopLock.withPermit(
                Effect.gen(function* () {
                    yield* Effect.forEach(drainers, drainer => drainer.stop(), { discard: true });
                    yield* chatService.interrupt.pipe(
                        Effect.andThen(
                            Effect.forEach(drainers, drainer => drainer.whenIdle(), { concurrency: 'unbounded', discard: true })
                        ),
                        Effect.timeout(settleGraceMs),
                        Effect.ignore
                    );
                    if (isActive()) {
                        return;
                    }
                    yield* aiModelResidencyService.suspend();
                })
            )
        );

        const stopSubsystemsStrict = Effect.fn('AiCoordinatorService.stopSubsystemsStrict')(() =>
            stopLock.withPermit(
                Effect.gen(function* () {
                    yield* Effect.forEach(drainers, drainer => drainer.stop(), { discard: true });
                    yield* chatService.interrupt;
                    const settled = yield* Effect.forEach(drainers, drainer => drainer.whenIdle(), {
                        concurrency: 'unbounded',
                        discard: true
                    }).pipe(
                        Effect.timeout(settleGraceMs),
                        Effect.andThen(localEmbeddingService.whenIdle.pipe(Effect.timeout(settleGraceMs))),
                        Effect.exit
                    );
                    yield* aiModelResidencyService.suspend();
                    yield* settled;
                })
            )
        );

        const releaseAfterDelay = Effect.fn('AiCoordinatorService.releaseAfterDelay')(function* () {
            yield* Effect.sleep(BACKGROUND_RELEASE_DELAY_MS);
            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: true });
            yield* Effect.forkDetach(stopSubsystems());
        });

        const handleAppStateChange = Effect.fn('AiCoordinatorService.handleAppStateChange')(function* (
            state: AppStateStatus,
            releaseTimer: FiberHandle.FiberHandle
        ) {
            if (state !== 'active') {
                yield* Effect.forEach(drainers, drainer => drainer.halt(), { discard: true });
                drainers.forEach(drainer => {
                    drainer.cancelBoost();
                });
                yield* FiberHandle.run(releaseTimer, releaseAfterDelay(), { onlyIfMissing: true });

                return;
            }
            yield* FiberHandle.clear(releaseTimer);
            yield* Effect.forEach(yield* getEnabledDrainers(), drainer => drainer.schedule(), { discard: true });
            if (appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended) {
                patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: false });
                yield* startSubsystemsWhenIdle();
            }
        });

        const startUnlocked = Effect.fn('AiCoordinatorService.startUnlocked')(function* () {
            if (isDefined(activeScope) || !appAtomRegistry.get(aiCoordinatorSnapshotAtom).isAvailable || !(yield* isRuntimeEnabled())) {
                return;
            }
            const scope = Scope.makeUnsafe();
            activeScope = scope;
            const run = yield* Scope.provide(FiberSet.makeRuntime<Db>(), scope);
            const releaseTimer = yield* Scope.provide(FiberHandle.make(), scope);
            yield* Scope.provide(
                Effect.acquireRelease(
                    Effect.sync(() =>
                        AppState.addEventListener('change', state => {
                            run(handleAppStateChange(state, releaseTimer));
                        })
                    ),
                    subscription =>
                        Effect.sync(() => {
                            subscription.remove();
                        })
                ),
                scope
            );
            yield* Effect.forkIn(
                Stream.runForEach(SubscriptionRef.changes(workload.foregroundCount), count =>
                    Effect.forEach(drainers, drainer => drainer.setForegroundBusy(count > 0), { discard: true })
                ),
                scope
            );

            const isSuspended = AppState.currentState !== 'active' && AppState.currentState !== 'unknown';
            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended });
            if (!isSuspended) {
                run(startSubsystemsWhenIdle());
            }
        });

        const stopUnlocked = Effect.fn('AiCoordinatorService.stopUnlocked')(function* () {
            const scope = activeScope;
            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: true });
            if (!isDefined(scope)) {
                return;
            }
            activeScope = null;
            yield* Scope.close(scope, Exit.void);
            yield* Effect.forkDetach(stopSubsystems());
        });

        const stopAndWaitUnlocked = Effect.fn('AiCoordinatorService.stopAndWaitUnlocked')(function* () {
            const scope = activeScope;
            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: true });
            if (isDefined(scope)) {
                activeScope = null;
                yield* Scope.close(scope, Exit.void);
            }
            yield* stopSubsystemsStrict();
        });

        return {
            start: Effect.fn('AiCoordinatorService.start')(() => lifecycleLock.withPermit(startUnlocked())),
            stop: Effect.fn('AiCoordinatorService.stop')(() => lifecycleLock.withPermit(stopUnlocked())),
            withStoppedRuntime: Effect.fn('AiCoordinatorService.withStoppedRuntime')(function* <A, E, R>(effect: Effect.Effect<A, E, R>) {
                return yield* lifecycleLock.withPermit(
                    Effect.gen(function* () {
                        const shouldRestart = yield* isRuntimeEnabled();

                        return yield* stopAndWaitUnlocked().pipe(
                            Effect.andThen(effect),
                            Effect.onExit(() => (shouldRestart ? startUnlocked() : Effect.void))
                        );
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiCoordinatorService, AiCoordinatorService.make).pipe(
        Layer.provide([
            Workload.layer,
            AiModelResidencyService.layer,
            ChatService.layer,
            LocalEmbeddingService.layer,
            EmbeddingDrainerService.layer,
            AiEmbeddingStatusService.layer,
            TranslationDrainerService.layer,
            TranslationProgressStore.layer,
            EmbeddingProgressStore.layer,
            SettingsRepository.layer
        ])
    );
}
