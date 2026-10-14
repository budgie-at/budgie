import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { Workload } from '@app/@generic/service/workload.service';
import {
    aiCoordinatorSnapshotAtom,
    translationDrainerSnapshotAtom,
    translationProgressSnapshotAtom,
    embeddingProgressSnapshotAtom
} from '@app/ai/constant/ai-snapshot-atoms.constant';
import { AiCoordinatorService } from '@app/ai/service/ai-coordinator.service';
import { AiEmbeddingStatusService } from '@app/ai/service/ai-embedding-status.service';
import { AiModelResidencyService } from '@app/ai/service/ai-model-residency.service';
import { ChatService } from '@app/ai/service/chat.service';
import { EmbeddingDrainerService } from '@app/ai/service/embedding-drainer.service';
import { LocalEmbeddingService } from '@app/ai/service/embedding.service';
import { TranslationDrainerService } from '@app/ai/service/translation-drainer.service';
import { EmbeddingProgressStore } from '@app/ai/store/embedding-progress.store';
import { TranslationProgressStore } from '@app/ai/store/translation-progress.store';
import { Db, DbError, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { testDb } from '../../harness/scenario/setup';

vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: emptyFn }) } }));

const restartError = new DbError({ cause: new Error('restart settings read failed') });
const cleanupError = new DbError({ cause: new Error('cleanup failed') });

const makeCoordinator = Effect.fnUntraced(function* (failRestart: boolean) {
    let settingsReads = 0;
    const settingsRepository = yield* SettingsRepository.make;
    yield* settingsRepository.update({
        isAiEnabled: true,
        isAiVoiceInputEnabled: true,
        isAiSuggestionsEnabled: false,
        isAiTranslationsEnabled: false
    });
    const foregroundCount = yield* SubscriptionRef.make(0);
    appAtomRegistry.set(aiCoordinatorSnapshotAtom, { isAvailable: true, isSuspended: false });

    return yield* AiCoordinatorService.make.pipe(
        Effect.provide(
            Layer.mergeAll(
                Layer.mock(Workload, { foregroundCount }),
                Layer.mock(AiModelResidencyService, { suspend: () => Effect.void, resume: () => Effect.void }),
                ChatService.layer,
                LocalEmbeddingService.layer,
                Layer.mock(EmbeddingDrainerService, { drainers: [] }),
                Layer.mock(AiEmbeddingStatusService, {}),
                Layer.mock(TranslationDrainerService, {
                    snapshot: translationDrainerSnapshotAtom,
                    cancelBoost: emptyFn,
                    stop: () => Effect.void,
                    whenIdle: () => Effect.void,
                    setForegroundBusy: () => Effect.void
                }),
                Layer.mock(TranslationProgressStore, { snapshot: translationProgressSnapshotAtom }),
                Layer.mock(EmbeddingProgressStore, { snapshot: embeddingProgressSnapshotAtom }),
                Layer.mock(SettingsRepository, {
                    getSettings: () =>
                        Effect.gen(function* () {
                            settingsReads += 1;
                            if (failRestart && settingsReads === 2) {
                                return yield* restartError;
                            }

                            return yield* settingsRepository.getSettings();
                        })
                })
            )
        )
    );
});

describe('AiCoordinatorService.withStoppedRuntime', () => {
    it.effect('reports restart settings failure after successful cleanup and remains suspended', () =>
        Effect.gen(function* () {
            const coordinator = yield* makeCoordinator(true);
            const result = yield* Effect.exit(coordinator.withStoppedRuntime(Effect.succeed('cleaned')));

            expect(Exit.isFailure(result)).toBe(true);
            if (Exit.isFailure(result)) {
                expect(result.cause.reasons.filter(Cause.isFailReason).map(reason => reason.error)).toEqual([restartError]);
            }
            expect(appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended).toBe(true);
        }).pipe(Effect.provideService(Db, testDb))
    );

    it.effect('retains the cleanup failure first and the restart failure in the cause', () =>
        Effect.gen(function* () {
            const coordinator = yield* makeCoordinator(true);
            const result = yield* Effect.exit(coordinator.withStoppedRuntime(Effect.fail(cleanupError)));

            expect(Exit.isFailure(result)).toBe(true);
            if (Exit.isFailure(result)) {
                expect(result.cause.reasons.filter(Cause.isFailReason).map(reason => reason.error)).toEqual([cleanupError, restartError]);
            }
            expect(appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended).toBe(true);
        }).pipe(Effect.provideService(Db, testDb))
    );

    it.effect('restarts only after cleanup finishes and returns its result', () =>
        Effect.gen(function* () {
            const coordinator = yield* makeCoordinator(false);
            const result = yield* coordinator.withStoppedRuntime(
                Effect.sync(() => {
                    expect(appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended).toBe(true);

                    return 'cleaned';
                })
            );

            expect(appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended).toBe(false);
            yield* coordinator.stop();
            expect(appAtomRegistry.get(aiCoordinatorSnapshotAtom).isSuspended).toBe(true);

            expect(result).toBe('cleaned');
        }).pipe(Effect.provideService(Db, testDb))
    );
});
