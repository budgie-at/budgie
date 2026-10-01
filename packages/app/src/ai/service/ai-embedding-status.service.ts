import { CommentEmbeddingRepository, MerchantEmbeddingRepository, TransactionEmbeddingRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';

import { EMBEDDING_MODEL_STORAGE_KEY } from '../constant/embedding-model-storage-key.constant';
import { EmbeddingProgressStore } from '../store/embedding-progress.store';
import { EMBEDDING_MODEL_FILENAME } from '../util/ai-constants.util';

import { EmbeddingDrainerService } from './embedding-drainer.service';

const LEGACY_EMBEDDING_MODEL_FILENAME = 'nomic-embed-text-v2-moe.Q8_0.gguf';

export class AiEmbeddingStatusService extends Context.Service<AiEmbeddingStatusService>()('@budgie/app/AiEmbeddingStatusService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const embeddingDrainerService = yield* EmbeddingDrainerService;
        const embeddingProgressStore = yield* EmbeddingProgressStore;

        const reset = Effect.all([
            merchantEmbeddingRepository.truncate(),
            commentEmbeddingRepository.truncate(),
            transactionEmbeddingRepository.markAllForEmbedding(),
            transactionEmbeddingRepository.clearNonIndexableFlags()
        ]);

        return {
            migrateModel: Effect.fn('AiEmbeddingStatusService.migrateModel')(function* () {
                const storedModel = yield* Effect.promise(() => Storage.getItem(EMBEDDING_MODEL_STORAGE_KEY));
                if (storedModel === EMBEDDING_MODEL_FILENAME) {
                    return;
                }
                yield* reset;
                yield* Effect.promise(() => Storage.setItem(EMBEDDING_MODEL_STORAGE_KEY, EMBEDDING_MODEL_FILENAME));
                yield* Effect.sync(() => {
                    const legacyModel = new File(Paths.document, LEGACY_EMBEDDING_MODEL_FILENAME);
                    if (legacyModel.exists) {
                        legacyModel.delete();
                    }
                });
            }),
            rebuild: Effect.fn('AiEmbeddingStatusService.rebuild')(
                function* () {
                    yield* embeddingDrainerService.pause();
                    yield* Effect.ensuring(reset, embeddingDrainerService.resume());
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
