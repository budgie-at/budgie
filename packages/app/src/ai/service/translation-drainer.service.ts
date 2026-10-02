import { TranslationLlmService } from '@budgie/ai';
import { CategoryRepository, TagRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { translationDrainerSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { TranslationProgressStore } from '../store/translation-progress.store';

import { AiModelResidencyService } from './ai-model-residency.service';
import { ChatService } from './chat.service';
import { DrainerService } from './drainer.service';

import type { AiInvokeError } from '@budgie/ai';
import type { CategoryEntityInterface, Db, DbError } from '@budgie/contracts';

export class TranslationDrainerService extends Context.Service<TranslationDrainerService>()('@budgie/app/TranslationDrainerService', {
    make: Effect.gen(function* () {
        const categoryRepository = yield* CategoryRepository;
        const tagRepository = yield* TagRepository;
        const translationLlmService = yield* TranslationLlmService;
        const translationProgressStore = yield* TranslationProgressStore;
        const aiModelResidencyService = yield* AiModelResidencyService;

        const translateRow = (
            row: Pick<CategoryEntityInterface, 'id' | 'title'>,
            updateTranslation: (id: number, titleEn: string, titleTags: string) => Effect.Effect<void, DbError, Db>
        ): Effect.Effect<void, DbError | AiInvokeError, Db> =>
            translationLlmService
                .translate(row.title)
                .pipe(Effect.flatMap(result => updateTranslation(row.id, result.titleEn, result.titleTags)));

        return new DrainerService<DbError | AiInvokeError>(
            {
                subsystem: AiSubsystemNameEnum.CHAT,
                relaxedIntervalMs: 5000,
                relaxedBatchSize: 3,
                boostBatchSize: 5,
                yieldEveryRows: 2,
                snapshot: translationDrainerSnapshotAtom,
                fetchPending: limit =>
                    Effect.all(
                        [
                            categoryRepository.findUntranslated(Math.ceil(limit / 2)),
                            tagRepository.findUntranslated(limit - Math.ceil(limit / 2))
                        ],
                        {
                            concurrency: 'unbounded'
                        }
                    ).pipe(
                        Effect.map(([categories, tags]) => [
                            ...categories.map(row => translateRow(row, categoryRepository.updateTranslation)),
                            ...tags.map(row =>
                                translateRow(row, (id, titleEn, titleTags) => tagRepository.updateTranslation(id, titleEn, titleTags))
                            )
                        ])
                    ),
                countPending: Effect.map(
                    translationProgressStore.refresh(),
                    () => appAtomRegistry.get(translationProgressStore.snapshot).pending
                ),
                afterBatch: Effect.void
            },
            aiModelResidencyService
        );
    })
}) {
    static readonly layer = Layer.effect(TranslationDrainerService, TranslationDrainerService.make).pipe(
        Layer.provide([
            CategoryRepository.layer,
            TagRepository.layer,
            TranslationLlmService.layer.pipe(Layer.provide(ChatService.invokerLayer)),
            TranslationProgressStore.layer,
            AiModelResidencyService.layer
        ])
    );
}
