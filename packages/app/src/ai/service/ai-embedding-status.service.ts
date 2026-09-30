import { CommentEmbeddingRepository, MerchantEmbeddingRepository, TransactionEmbeddingRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EmbeddingProgressStore } from '../store/embedding-progress.store';

import { EmbeddingDrainerService } from './embedding-drainer.service';

export class AiEmbeddingStatusService extends Context.Service<AiEmbeddingStatusService>()('@budgie/app/AiEmbeddingStatusService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const embeddingDrainerService = yield* EmbeddingDrainerService;
        const embeddingProgressStore = yield* EmbeddingProgressStore;

        return {
            rebuild: Effect.fn('AiEmbeddingStatusService.rebuild')(
                function* () {
                    yield* embeddingDrainerService.pause();
                    yield* Effect.ensuring(
                        Effect.all([
                            merchantEmbeddingRepository.truncate(),
                            commentEmbeddingRepository.truncate(),
                            transactionEmbeddingRepository.markAllForEmbedding(),
                            transactionEmbeddingRepository.clearNonIndexableFlags()
                        ]),
                        embeddingDrainerService.resume()
                    );
                    yield* embeddingProgressStore.refresh();
                    yield* embeddingDrainerService.boost();
                },
                effect => Effect.onError(effect, () => embeddingDrainerService.resume())
            )
        };
    })
}) {
    static readonly layer = Layer.effect(AiEmbeddingStatusService, AiEmbeddingStatusService.make).pipe(
        Layer.provide([
            MerchantEmbeddingRepository.layer,
            CommentEmbeddingRepository.layer,
            TransactionEmbeddingRepository.layer,
            EmbeddingDrainerService.layer,
            EmbeddingProgressStore.layer
        ])
    );
}
