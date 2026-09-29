import { TranslationLlmService } from '@budgie/ai';
import * as Effect from 'effect/Effect';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { translationProgressStore } from '../store/translation-progress.store';

import { chatService } from './chat.service';
import { DrainerService } from './drainer.service';

import type { AiInvokeError } from '@budgie/ai';
import type { CategoryEntityInterface, Db, DbError } from '@budgie/contracts';

const translationLlmService = new TranslationLlmService(chatService);

const translateRow = (
    row: Pick<CategoryEntityInterface, 'id' | 'title'>,
    updateTranslation: (id: number, titleEn: string, titleTags: string) => Effect.Effect<void, DbError, Db>
): Effect.Effect<void, DbError | AiInvokeError, Db> =>
    translationLlmService.translate(row.title).pipe(Effect.flatMap(result => updateTranslation(row.id, result.titleEn, result.titleTags)));

export const translationDrainerService = new DrainerService<DbError | AiInvokeError>({
    subsystem: AiSubsystemNameEnum.CHAT,
    relaxedIntervalMs: 5000,
    relaxedBatchSize: 3,
    boostBatchSize: 5,
    yieldEveryRows: 2,
    fetchPending: limit =>
        Effect.all(
            [categoryRepository.findUntranslated(Math.ceil(limit / 2)), tagRepository.findUntranslated(limit - Math.ceil(limit / 2))],
            {
                concurrency: 'unbounded'
            }
        ).pipe(
            Effect.map(([categories, tags]) => [
                ...categories.map(row => translateRow(row, categoryRepository.updateTranslation)),
                ...tags.map(row => translateRow(row, tagRepository.updateTranslation))
            ])
        ),
    countPending: Effect.map(translationProgressStore.refresh(), () => aiAtomRegistry.get(translationProgressStore.snapshot).pending),
    afterBatch: Effect.void
});
