import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { Workload } from '@app/@generic/service/workload.service';
import {
    aiCoordinatorSnapshotAtom,
    embeddingProgressSnapshotAtom,
    translationDrainerSnapshotAtom,
    translationProgressSnapshotAtom
} from '@app/ai/constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '@app/ai/enum/ai-subsystem-name.enum';
import { AiCoordinatorService } from '@app/ai/service/ai-coordinator.service';
import { AiEmbeddingStatusService } from '@app/ai/service/ai-embedding-status.service';
import { AiModelResidencyService } from '@app/ai/service/ai-model-residency.service';
import { ChatService } from '@app/ai/service/chat.service';
import { EmbeddingDrainerService } from '@app/ai/service/embedding-drainer.service';
import { TranslationDrainerService } from '@app/ai/service/translation-drainer.service';
import { EmbeddingProgressStore } from '@app/ai/store/embedding-progress.store';
import { TranslationProgressStore } from '@app/ai/store/translation-progress.store';
import { Db, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { testDb } from '../../harness/scenario/setup';

vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: emptyFn }) } }));

const cases = [
    {
        features: { isAiVoiceInputEnabled: true, isAiSuggestionsEnabled: false, isAiTranslationsEnabled: false },
        subsystems: [AiSubsystemNameEnum.CHAT, AiSubsystemNameEnum.EMBEDDING, AiSubsystemNameEnum.STT],
        startedDrainers: []
    },
    {
        features: { isAiVoiceInputEnabled: false, isAiSuggestionsEnabled: false, isAiTranslationsEnabled: true },
        subsystems: [AiSubsystemNameEnum.CHAT],
        startedDrainers: ['translation']
    }
];

describe('AiCoordinatorService.start', () => {
    it.effect.each(cases)('loads only the models and drainers of enabled features %#', ({ features, subsystems, startedDrainers }) =>
        Effect.gen(function* () {
            const settingsRepository = yield* SettingsRepository;
            yield* settingsRepository.update({ isAiEnabled: true, ...features });
            appAtomRegistry.set(aiCoordinatorSnapshotAtom, { isAvailable: true, isSuspended: false });
            const started = yield* Deferred.make<boolean>();
            const resumedSubsystems: AiSubsystemNameEnum[] = [];
            const drainerStarts: string[] = [];
            const recordStart = (drainer: string) => () => Effect.sync(() => void drainerStarts.push(drainer));

            const coordinator = yield* AiCoordinatorService.make.pipe(
                Effect.provide(
                    Layer.mergeAll(
                        Layer.mock(Workload, { foregroundCount: yield* SubscriptionRef.make(0) }),
                        Layer.mock(AiModelResidencyService, {
                            resume: enabled => Effect.sync(() => void resumedSubsystems.push(...enabled))
                        }),
                        ChatService.layer,
                        Layer.mock(EmbeddingDrainerService, { drainers: [], start: recordStart('embedding') }),
                        Layer.mock(AiEmbeddingStatusService, { migrateModel: () => Effect.void }),
                        Layer.mock(TranslationDrainerService, {
                            snapshot: translationDrainerSnapshotAtom,
                            cancelBoost: emptyFn,
                            start: recordStart('translation'),
                            setForegroundBusy: () => Effect.void
                        }),
                        Layer.mock(TranslationProgressStore, { snapshot: translationProgressSnapshotAtom, refresh: () => Effect.void }),
                        Layer.mock(EmbeddingProgressStore, {
                            snapshot: embeddingProgressSnapshotAtom,
                            refresh: () => Effect.asVoid(Deferred.succeed(started, true))
                        }),
                        Layer.succeed(SettingsRepository, settingsRepository)
                    )
                )
            );
            yield* coordinator.start();
            yield* Deferred.await(started);

            expect(resumedSubsystems).toEqual(subsystems);
            expect(drainerStarts).toEqual(startedDrainers);
        }).pipe(Effect.provide(SettingsRepository.layer), Effect.provideService(Db, testDb))
    );
});
