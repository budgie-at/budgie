import { TransactionEmbeddingRepository } from '@budgie/categorization';
import { TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { embeddingProgressSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';

import { ProgressStore } from './progress.store';

export class EmbeddingProgressStore extends Context.Service<EmbeddingProgressStore>()('@budgie/app/EmbeddingProgressStore', {
    make: Effect.gen(function* () {
        const transactionRepository = yield* TransactionRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;

        return new ProgressStore(
            embeddingProgressSnapshotAtom,
            Effect.all([transactionRepository.countAllActive(), transactionEmbeddingRepository.countPending()]),
            1000
        );
    })
}) {
    static readonly layer = Layer.effect(EmbeddingProgressStore, EmbeddingProgressStore.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionEmbeddingRepository.layer])
    );
}
