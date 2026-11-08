import { SyncAutomationEmbeddingBoost } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EmbeddingDrainerService } from '../../ai/service/embedding-drainer.service';

export const syncAutomationEmbeddingBoostLayer = Layer.effect(
    SyncAutomationEmbeddingBoost,
    Effect.map(EmbeddingDrainerService, embeddingDrainerService => embeddingDrainerService.boost())
).pipe(Layer.provide(EmbeddingDrainerService.layer));
