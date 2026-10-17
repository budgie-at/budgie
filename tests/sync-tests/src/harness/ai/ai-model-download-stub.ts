import { AiModelDownloadService } from '@app/ai/service/ai-model-download.service';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';

export const aiModelDownloadStub = Layer.mock(AiModelDownloadService, {
    completions: Stream.empty,
    modelPath: () => '/tmp/model',
    start: () => Effect.void,
    suspend: () => Effect.void,
    markDamaged: () => Effect.void
});
