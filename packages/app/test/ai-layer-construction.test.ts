import { TranslationLlmService } from '@budgie/ai';
import { EmbeddingIndexService, EmbeddingSuggestionService } from '@budgie/categorization';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { ChatService } from '../src/ai/service/chat.service';
import { EmbeddingDrainerService } from '../src/ai/service/embedding-drainer.service';
import { LocalEmbeddingService } from '../src/ai/service/embedding.service';
import { TranslationDrainerService } from '../src/ai/service/translation-drainer.service';

import { inertDbLayer } from './fixture/inert-db-layer';

vi.mock('react-native', () => ({ AppState: { currentState: 'background' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));

const constructions = vi.hoisted(() => ({ translationLlm: 0, embeddingIndex: 0, embeddingSuggestion: 0 }));

vi.mock('../src/ai/service/chat.service', async () => ({ ChatService: (await import('./fixture/tag-module')).tagModule('Chat') }));
vi.mock('../src/ai/service/embedding.service', async () => ({
    LocalEmbeddingService: (await import('./fixture/tag-module')).tagModule('LocalEmbedding')
}));
vi.mock('../src/ai/service/ai-model-residency.service', async () => ({
    AiModelResidencyService: (await import('./fixture/tag-module')).tagModule('Residency')
}));
vi.mock('../src/ai/store/embedding-progress.store', async () => ({
    EmbeddingProgressStore: (await import('./fixture/tag-module')).tagModule('EmbeddingProgress', { refresh: () => ({}) })
}));
vi.mock('../src/ai/store/translation-progress.store', async () => ({
    TranslationProgressStore: (await import('./fixture/tag-module')).tagModule('TranslationProgress', { refresh: () => ({}) })
}));
vi.mock('../src/ai/service/drainer.service', async () => {
    const Effect = await import('effect/Effect');

    return { DrainerService: { make: () => Effect.succeed({}) } };
});
vi.mock('@budgie/ai', async importOriginal => {
    const { makeCountingService } = await import('./fixture/counting-service');

    return {
        ...(await importOriginal<typeof import('@budgie/ai')>()),
        TranslationLlmService: makeCountingService('test/TranslationLlmService', {}, () => void (constructions.translationLlm += 1))
    };
});
vi.mock('@budgie/categorization', async importOriginal => {
    const { makeCountingService } = await import('./fixture/counting-service');
    const Layer = await import('effect/Layer');
    const Effect = await import('effect/Effect');
    const suggestion = makeCountingService('test/EmbeddingSuggestionService', {}, () => void (constructions.embeddingSuggestion += 1));
    const indexSlice = { next: Effect.void, countPending: Effect.succeed(0), flush: Effect.void };
    const index = makeCountingService(
        'test/EmbeddingIndexService',
        { clearStaleFlags: Effect.void, merchant: indexSlice, comment: indexSlice },
        () => void (constructions.embeddingIndex += 1)
    );

    return {
        ...(await importOriginal<typeof import('@budgie/categorization')>()),
        EmbeddingSuggestionService: suggestion,
        EmbeddingIndexService: Object.assign(index, { layer: index.layer.pipe(Layer.provide(suggestion.layer)) })
    };
});

describe('ai invoker-wired layers', () => {
    it.effect('builds each invoker-wired service once when a drainer and the app registration both wire it', () =>
        Layer.build(
            Layer.mergeAll(
                EmbeddingSuggestionService.layer.pipe(Layer.provide(LocalEmbeddingService.invokerLayer)),
                EmbeddingIndexService.layer.pipe(Layer.provide(LocalEmbeddingService.invokerLayer)),
                EmbeddingDrainerService.layer,
                TranslationLlmService.layer.pipe(Layer.provide(ChatService.invokerLayer)),
                TranslationDrainerService.layer
            ).pipe(Layer.provide(inertDbLayer))
        ).pipe(
            Effect.tap(() =>
                Effect.sync(() => {
                    expect(constructions).toEqual({ translationLlm: 1, embeddingIndex: 1, embeddingSuggestion: 1 });
                })
            ),
            Effect.scoped
        )
    );
});
