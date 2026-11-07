import { SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as Atom from 'effect/reactivity/Atom';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { appAtomRegistry } from '../src/@generic/constant/app-atom-registry.constant';
import { Workload } from '../src/@generic/service/workload.service';
import { aiCoordinatorSnapshotAtom } from '../src/ai/constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../src/ai/enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../src/ai/enum/ai-subsystem-status.enum';
import { DrainerStateEnum } from '../src/ai/enum/drainer-state.enum';
import { AiCoordinatorService } from '../src/ai/service/ai-coordinator.service';
import { AiEmbeddingStatusService } from '../src/ai/service/ai-embedding-status.service';
import { AiModelDownloadService } from '../src/ai/service/ai-model-download.service';
import { AiModelResidencyService } from '../src/ai/service/ai-model-residency.service';
import { ChatService } from '../src/ai/service/chat.service';
import { EmbeddingDrainerService } from '../src/ai/service/embedding-drainer.service';
import { LlamaModelService } from '../src/ai/service/llama-model.service';
import { TranslationDrainerService } from '../src/ai/service/translation-drainer.service';
import { EmbeddingProgressStore } from '../src/ai/store/embedding-progress.store';
import { TranslationProgressStore } from '../src/ai/store/translation-progress.store';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import { inertDbLayer } from './fixture/inert-db-layer';

import type { DrainerSnapshotInterface } from '../src/ai/interface/drainer-snapshot.interface';
import type { LlamaSubsystemSnapshotInterface } from '../src/ai/interface/llama-subsystem-snapshot.interface';

vi.mock('react-native', () => ({
    AppState: { currentState: 'background', addEventListener: () => ({ remove: () => undefined }) }
}));

vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));

const { tagModule } = vi.hoisted(() => ({
    tagModule: async (name: string) => {
        const Context = await import('effect/Context');
        const Layer = await import('effect/Layer');

        return Object.assign(Context.Service<object>(`test/${name}`), { layer: Layer.empty });
    }
}));

vi.mock('../src/ai/service/ai-embedding-status.service', async () => ({ AiEmbeddingStatusService: await tagModule('Status') }));
vi.mock('../src/ai/service/ai-model-download.service', async () => ({ AiModelDownloadService: await tagModule('Download') }));
vi.mock('../src/ai/service/ai-model-residency.service', async () => ({ AiModelResidencyService: await tagModule('Residency') }));
vi.mock('../src/ai/service/chat.service', async () => ({ ChatService: await tagModule('Chat') }));
vi.mock('../src/ai/service/embedding-drainer.service', async () => ({ EmbeddingDrainerService: await tagModule('EmbeddingDrainer') }));
vi.mock('../src/ai/service/translation-drainer.service', async () => ({
    TranslationDrainerService: await tagModule('TranslationDrainer')
}));
vi.mock('../src/ai/store/embedding-progress.store', async () => ({ EmbeddingProgressStore: await tagModule('EmbeddingStore') }));
vi.mock('../src/ai/store/translation-progress.store', async () => ({ TranslationProgressStore: await tagModule('TranslationStore') }));

const counters = { downloadStarts: 0, residencySuspends: 0, isDownloadSuspendFailing: false };

const settings = {
    ...DEFAULT_SETTINGS,
    isAiEnabled: true,
    isAiVoiceInputEnabled: false,
    isAiSuggestionsEnabled: false,
    isAiTranslationsEnabled: false
};

const downloadLayer = Layer.mock(AiModelDownloadService)({
    start: () => Effect.sync(() => void (counters.downloadStarts += 1)),
    suspend: () => (counters.isDownloadSuspendFailing ? Effect.die('download suspend failed') : Effect.void),
    modelPath: () => null
});

const chatLayer = Layer.unwrap(
    Effect.map(AiModelDownloadService, download =>
        Layer.mock(ChatService)({
            interrupt: Effect.void,
            isReady: false,
            model: new LlamaModelService(
                {
                    name: AiSubsystemNameEnum.CHAT,
                    contextSize: 1,
                    embedding: false,
                    snapshot: Atom.make<LlamaSubsystemSnapshotInterface>({ status: AiSubsystemStatusEnum.IDLE, errorMessage: null })
                },
                download
            )
        })
    )
).pipe(Layer.provide(downloadLayer));

const coordinatorLayer = Layer.effect(AiCoordinatorService, AiCoordinatorService.make).pipe(
    Layer.provide([
        Workload.layer,
        Layer.mock(AiModelResidencyService)({
            resume: () => Effect.void,
            suspend: () => Effect.suspend(() => ((counters.residencySuspends += 1) === 1 ? Effect.die('suspend failed') : Effect.void))
        }),
        chatLayer,
        Layer.mock(EmbeddingDrainerService)({ drainers: [] }),
        Layer.mock(AiEmbeddingStatusService)({}),
        Layer.mock(TranslationDrainerService)({
            stop: () => Effect.void,
            whenIdle: () => Effect.void,
            halt: () => Effect.void,
            schedule: () => Effect.void,
            cancelBoost: emptyFn,
            setForegroundBusy: () => Effect.void,
            snapshot: Atom.make<DrainerSnapshotInterface>({ state: DrainerStateEnum.IDLE, pending: 0, errorMessage: null })
        }),
        Layer.mock(TranslationProgressStore)({ snapshot: Atom.make({ percent: 0, pending: 0, total: 0 }) }),
        Layer.mock(EmbeddingProgressStore)({ snapshot: Atom.make({ percent: 0, pending: 0, total: 0 }) }),
        downloadLayer,
        Layer.mock(SettingsRepository)({ getSettings: () => Effect.succeed(settings) })
    ])
);

const testLayer = coordinatorLayer.pipe(Layer.provideMerge([inertDbLayer, FetchHttpClient.layer]));

describe('AiCoordinatorService lifecycle', () => {
    it.live('can start again after a stop whose subsystem shutdown failed', () =>
        Effect.gen(function* () {
            appAtomRegistry.set(aiCoordinatorSnapshotAtom, { isAvailable: true, isSuspended: false });
            const coordinator = yield* AiCoordinatorService;
            yield* coordinator.start();
            const stopExit = yield* Effect.exit(coordinator.stop());
            yield* coordinator.start();

            expect(Exit.isFailure(stopExit)).toBe(true);
            expect(counters.downloadStarts).toBe(2);
        }).pipe(Effect.provide(testLayer))
    );

    it.live('still suspends model residency when the download suspend fails', () =>
        Effect.gen(function* () {
            appAtomRegistry.set(aiCoordinatorSnapshotAtom, { isAvailable: true, isSuspended: false });
            const coordinator = yield* AiCoordinatorService;
            yield* coordinator.start();
            counters.isDownloadSuspendFailing = true;
            const residencySuspendsBefore = counters.residencySuspends;
            const stopExit = yield* Effect.exit(coordinator.stop());

            expect(Exit.isFailure(stopExit)).toBe(true);
            expect(counters.residencySuspends).toBe(residencySuspendsBefore + 1);
        }).pipe(Effect.provide(testLayer))
    );
});
