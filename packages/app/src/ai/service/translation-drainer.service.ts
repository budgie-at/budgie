import { TranslationLlmService } from '@budgie/ai';
import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { translationProgressStore } from '../store/translation-progress.store';

import { BaseDrainerService } from './base-drainer.service';
import { chatService } from './chat.service';

import type { CategoryOrTagRowInterface } from '../interface/category-or-tag-row.interface';
import type { TranslationResultInterface } from '@budgie/ai';

class TranslationDrainerService extends BaseDrainerService<CategoryOrTagRowInterface> {
    private static readonly RELAXED_INTERVAL_MS = 5000;
    private static readonly RELAXED_BATCH_SIZE = 3;
    private static readonly BOOST_BATCH_SIZE = 5;
    private static readonly YIELD_EVERY_ROWS = 2;

    protected readonly kind = DrainerKindEnum.TRANSLATION;
    protected readonly relaxedIntervalMs = TranslationDrainerService.RELAXED_INTERVAL_MS;
    protected readonly relaxedBatchSize = TranslationDrainerService.RELAXED_BATCH_SIZE;
    protected readonly boostBatchSize = TranslationDrainerService.BOOST_BATCH_SIZE;
    protected readonly yieldEveryRows = TranslationDrainerService.YIELD_EVERY_ROWS;

    @Log(
        row => `enter kind=${row.kind} id=${row.id} title="${row.title}"`,
        (result, row) => `done id=${row.id} titleEn="${result.titleEn}"`,
        (error, row) => `throw id=${row.id} error=${getErrorMessage(error)}`
    )
    private async translateRow(row: CategoryOrTagRowInterface): Promise<TranslationResultInterface> {
        const service = new TranslationLlmService(chatService);

        return service.translate(row.title);
    }

    @Log(
        (row, translationResult) => `enter kind=${row.kind} id=${row.id} titleEn="${translationResult.titleEn}"`,
        'done',
        (error, row, translationResult) => `throw id=${row.id} titleEn="${translationResult.titleEn}" error=${getErrorMessage(error)}`
    )
    private async persistTranslation(row: CategoryOrTagRowInterface, result: TranslationResultInterface): Promise<void> {
        if (row.kind === 'category') {
            await categoryRepository.updateTranslation(row.id, result.titleEn, result.titleTags);
        } else {
            await tagRepository.updateTranslation(row.id, result.titleEn, result.titleTags);
        }
    }

    protected subscribeToSubsystem(listener: () => void): () => void {
        return chatService.subscribe(listener);
    }

    protected isSubsystemReady(): boolean {
        return chatService.isReady;
    }

    protected async fetchPending(limit: number): Promise<CategoryOrTagRowInterface[]> {
        const half = Math.ceil(limit / 2);
        const [categories, tags] = await Promise.all([
            categoryRepository.findUntranslated(half),
            tagRepository.findUntranslated(limit - half)
        ]);

        return [
            ...categories.map((row): CategoryOrTagRowInterface => ({ kind: 'category', id: row.id, title: row.title })),
            ...tags.map((row): CategoryOrTagRowInterface => ({ kind: 'tag', id: row.id, title: row.title }))
        ];
    }

    protected async countPending(): Promise<number> {
        await translationProgressStore.refresh();

        return translationProgressStore.getSnapshot().pending;
    }

    protected async processRow(row: CategoryOrTagRowInterface): Promise<void> {
        const result = await this.translateRow(row);
        await this.persistTranslation(row, result);
    }
}

export const translationDrainerService = new TranslationDrainerService();
