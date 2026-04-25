import { TranslationLlmService } from '@budgie/ai';
import { Log } from '@budgie/contracts';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { translationProgressStore } from '../store/translation-progress.store';

import { BaseDrainerService } from './base-drainer.service';
import { chatService } from './chat.service';

import type { CategoryOrTagRowInterface } from '../interface/category-or-tag-row.interface';
import type { TranslationResultInterface } from '@budgie/ai';

const RELAXED_INTERVAL_MS = 5000;
const RELAXED_BATCH_SIZE = 3;
const BOOST_BATCH_SIZE = 5;
const YIELD_EVERY_ROWS = 2;

class TranslationDrainerService extends BaseDrainerService<CategoryOrTagRowInterface> {
    protected readonly kind = DrainerKindEnum.TRANSLATION;
    protected readonly logDomain = 'drainer:translation';
    protected readonly relaxedIntervalMs = RELAXED_INTERVAL_MS;
    protected readonly relaxedBatchSize = RELAXED_BATCH_SIZE;
    protected readonly boostBatchSize = BOOST_BATCH_SIZE;
    protected readonly yieldEveryRows = YIELD_EVERY_ROWS;

    @Log(
        row => `enter kind=${row.kind} id=${row.id} title=${row.title}`,
        (result, row) => `done kind=${row.kind} id=${row.id} titleEnLen=${result.titleEn.length}`,
        (error, row) => `throw kind=${row.kind} id=${row.id} error=${getErrorMessage(error)}`
    )
    private async translateRow(row: CategoryOrTagRowInterface): Promise<TranslationResultInterface> {
        const service = new TranslationLlmService(chatService);

        return service.translate(row.title);
    }

    @Log(
        row => `enter kind=${row.kind} id=${row.id}`,
        (_result, row) => `done kind=${row.kind} id=${row.id}`,
        (error, row) => `throw kind=${row.kind} id=${row.id} error=${getErrorMessage(error)}`
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
