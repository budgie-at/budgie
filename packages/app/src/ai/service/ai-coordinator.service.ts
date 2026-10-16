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
import { getEnabledAiSubsystems } from '../utils/get-enabled-ai-subsystems.util';
import { patchAtom } from '../utils/patch-atom.util';

import { AiEmbeddingStatusService } from './ai-embedding-status.service';
import { AiModelDownloadService } from './ai-model-download.service';
import { AiModelResidencyService } from './ai-model-residency.service';
import { ChatService } from './chat.service';
import { EmbeddingDrainerService } from './embedding-drainer.service';
import { TranslationDrainerService } from './translation-drainer.service';

import type { Db } from '@budgie/contracts';
import type { AppStateStatus } from 'react-native';

export class AiCoordinatorService extends Context.Service<AiCoordinatorService>()('@budgie/app/AiCoordinatorService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const aiModelResidencyService = yield* AiModelResidencyService;
        const chatService = yield* ChatService;
        const embeddingDrainerService = yield* EmbeddingDrainerService;
        const aiEmbeddingStatusService = yield* AiEmbeddingStatusService;
        const translationDrainerService = yield* TranslationDrainerService;
        const translationProgressStore = yield* TranslationProgressStore;
        const embeddingProgressStore = yield* EmbeddingProgressStore;
        const aiModelDownloadService = yield* AiModelDownloadService;
        const settingsRepository = yield* SettingsRepository;
        const settleGraceMs = 5_000;
        const drainers = [translationDrainerService, ...embeddingDrainerService.drainers];
        const lifecycle = yield* Semaphore.make(1);
        let activeScope: Scope.Closeable | null = null;

        const isActive = (): boolean => isDefined(activeScope) && !appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended;

        const startSubsystemsWhenIdle = Effect.fn('AiCoordinatorService.startSubsystemsWhenIdle')(function* () {
            yield* waitForIdle;
            yield* lifecycle.withPermit(
                Effect.uninterruptible(
                    Effect.gen(function* () {
                        if (!isActive()) {
                            return;
                        }
                        const settings = yield* settingsRepository.getSettings();
                        yield* aiModelResidencyService.resume(getEnabledAiSubsystems(settings));
                        if (settings.isAiTranslationsEnabled) {
                            yield* translationDrainerService.start();
                        }
                        if (settings.isAiSuggestionsEnabled) {
                            yield* aiEmbeddingStatusService.migrateModel();
                            yield* embeddingDrainerService.start();
                        }
                        yield* translationProgressStore.refresh();
                        yield* embeddingProgressStore.refresh();
                    })
                )
            );
        });

        const stopSubsystems = Effect.fn('AiCoordinatorService.stopSubsystems')(function* () {
            yield* Effect.all([Effect.forEach(drainers, drainer => drainer.stop(), { discard: true }), chatService.interrupt], {
                concurrency: 'unbounded',
                discard: true
            }).pipe(
                Effect.andThen(Effect.forEach(drainers, drainer => drainer.whenIdle(), { concurrency: 'unbounded', discard: true })),
                Effect.timeout(settleGraceMs)
            );
            yield* aiModelResidencyService.suspend();
        });

        const releaseAfterDelay = Effect.fn('AiCoordinatorService.releaseAfterDelay')(function* () {
            yield* Effect.sleep(BACKGROUND_RELEASE_DELAY_MS);
            yield* lifecycle.withPermit(
                Effect.uninterruptible(
                    Effect.gen(function* () {
                        patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: true });
                        yield* stopSubsystems();
                    })
                )
            );
        });

        const handleAppStateChange = Effect.fn('AiCoordinatorService.handleAppStateChange')(function* (
            state: AppStateStatus,
            releaseTimer: FiberHandle.FiberHandle
        ) {
            const shouldResume = yield* lifecycle.withPermit(
                Effect.uninterruptible(
                    Effect.gen(function* () {
                        if (state !== 'active') {
                            yield* Effect.forEach(drainers, drainer => drainer.halt(), { discard: true });
                            drainers.forEach(drainer => {
                                drainer.cancelBoost();
                            });
                            yield* FiberHandle.run(releaseTimer, releaseAfterDelay().pipe(Effect.tapCause(Effect.logError)), {
                                onlyIfMissing: true
                            });

                            return false;
                        }
                        yield* FiberHandle.clear(releaseTimer);
                        const { isSuspended } = appAtomRegistry.get(aiCoordinatorSnapshotAtom);
                        if (isSuspended) {
                            yield* stopSubsystems();
                            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: false });
                        }
                        yield* Effect.forEach(drainers, drainer => drainer.schedule(), { discard: true });

                        return isSuspended;
                    })
                )
            );
            if (shouldResume) {
                yield* startSubsystemsWhenIdle();
            }
        });

        const start = Effect.fnUntraced(function* () {
            if (isDefined(activeScope) || !appAtomRegistry.get(aiCoordinatorSnapshotAtom).isAvailable) {
                return;
            }
            const settings = yield* settingsRepository.getSettings();
            if (!settings.isAiEnabled) {
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
                            run(handleAppStateChange(state, releaseTimer).pipe(Effect.tapCause(Effect.logError)));
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
            yield* aiModelDownloadService.start(getEnabledAiSubsystems(settings));
            const isSuspended = AppState.currentState !== 'active' && AppState.currentState !== 'unknown';
            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended });
            if (!isSuspended) {
                run(startSubsystemsWhenIdle().pipe(Effect.tapCause(Effect.logError)));
            }
        });

        const stop = Effect.fnUntraced(function* () {
            const scope = activeScope;
            if (!isDefined(scope)) {
                return;
            }
            patchAtom(aiCoordinatorSnapshotAtom, { isSuspended: true });
            yield* Scope.close(scope, Exit.void);
            yield* aiModelDownloadService.suspend();
            yield* stopSubsystems();
            activeScope = null;
        });

        return {
            start: Effect.fn('AiCoordinatorService.start')(() => lifecycle.withPermit(Effect.uninterruptible(start()))),
            restart: Effect.fn('AiCoordinatorService.restart')(() =>
                lifecycle.withPermit(Effect.uninterruptible(Effect.andThen(stop(), start())))
            ),
            stop: Effect.fn('AiCoordinatorService.stop')(() => lifecycle.withPermit(Effect.uninterruptible(stop())))
        };
    })
}) {
    static readonly layer = Layer.effect(AiCoordinatorService, AiCoordinatorService.make).pipe(
        Layer.provide([
            Workload.layer,
            AiModelResidencyService.layer,
            ChatService.layer,
            EmbeddingDrainerService.layer,
            AiEmbeddingStatusService.layer,
            TranslationDrainerService.layer,
            TranslationProgressStore.layer,
            EmbeddingProgressStore.layer,
            AiModelDownloadService.layer,
            SettingsRepository.layer
        ])
    );
}
