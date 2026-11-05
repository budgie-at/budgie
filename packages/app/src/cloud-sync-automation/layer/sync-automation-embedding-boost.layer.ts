import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EmbeddingDrainerService } from '../../ai/service/embedding-drainer.service';
import { SyncAutomationEmbeddingBoost } from '../service/sync-automation-embedding-boost.service';

export const syncAutomationEmbeddingBoostLayer = Layer.effect(
    SyncAutomationEmbeddingBoost,
    Effect.gen(function* () {
        const embeddingDrainerService = yield* EmbeddingDrainerService;

        return embeddingDrainerService.boost();
    })
).pipe(Layer.provide(EmbeddingDrainerService.layer));
