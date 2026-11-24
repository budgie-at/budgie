import {
    CommentEmbeddingRepository,
    EMBEDDING_MODEL_FILENAME,
    EMBEDDING_DOCUMENT_FORMAT,
    MerchantEmbeddingRepository,
    TransactionEmbeddingRepository
} from '@budgie/categorization';
import { Storage } from '@op-engineering/op-sqlite';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { EmbeddingProgressStore } from '../store/embedding-progress.store';

import { EmbeddingDrainerService } from './embedding-drainer.service';

export class AiEmbeddingStatusService extends Context.Service<AiEmbeddingStatusService>()('@budgie/app/AiEmbeddingStatusService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const embeddingDrainerService = yield* EmbeddingDrainerService;
        const embeddingProgressStore = yield* EmbeddingProgressStore;
        const legacyEmbeddingModelFilename = 'nomic-embed-text-v2-moe.Q8_0.gguf';
        const embeddingModelStorageKey = 'ai.embeddingModel';
        const embeddingIndexVersion = `${EMBEDDING_MODEL_FILENAME}:${EMBEDDING_DOCUMENT_FORMAT}`;
        let storageInstance: Storage | null = null;
        const getStorage = (): Storage => {
            if (!isDefined(storageInstance)) {
                storageInstance = new Storage({ name: 'ai-embedding.sqlite' });
            }

            return storageInstance;
        };

        yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
                storageInstance?.closeSync();
                storageInstance = null;
            })
        );

        const reset = Effect.all([
            merchantEmbeddingRepository.truncate,
            commentEmbeddingRepository.truncate,
            transactionEmbeddingRepository.markAllForEmbedding,
            transactionEmbeddingRepository.clearNonIndexableFlags
        ]);

        return {
            migrateModel: Effect.fn('AiEmbeddingStatusService.migrateModel')(function* () {
                const storedModel = yield* Effect.promise(() => getStorage().getItem(embeddingModelStorageKey));
                if (storedModel === embeddingIndexVersion) {
                    return;
                }
                yield* reset;
                yield* Effect.promise(() => getStorage().setItem(embeddingModelStorageKey, embeddingIndexVersion));
                yield* Effect.sync(() => {
                    const legacyModel = new File(Paths.document, legacyEmbeddingModelFilename);
                    if (legacyModel.exists) {
                        legacyModel.delete();
                    }
                });
            }),
            forgetModel: Effect.promise(() => getStorage().removeItem(embeddingModelStorageKey)),
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
