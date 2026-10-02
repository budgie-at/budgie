import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { AiCoordinatorService } from './ai-coordinator.service';
import { EmbeddingDrainerService } from './embedding-drainer.service';
import { TranslationDrainerService } from './translation-drainer.service';

export class AiStorageReplacementService extends Context.Service<AiStorageReplacementService>()('@budgie/app/AiStorageReplacementService', {
    make: Effect.gen(function* () {
        const aiCoordinatorService = yield* AiCoordinatorService;
        const embeddingDrainerService = yield* EmbeddingDrainerService;
        const translationDrainerService = yield* TranslationDrainerService;

        return {
            pauseLongLivedRuntime: Effect.fn('AiStorageReplacementService.pauseLongLivedRuntime')(function* () {
                yield* Effect.all([translationDrainerService.pause(), embeddingDrainerService.pause()], { concurrency: 'unbounded' });
                yield* aiCoordinatorService.stop();
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AiStorageReplacementService, AiStorageReplacementService.make).pipe(
        Layer.provide([AiCoordinatorService.layer, EmbeddingDrainerService.layer, TranslationDrainerService.layer])
    );
}
