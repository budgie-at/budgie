import { TranslationLlmService } from '@budgie/ai';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { CategoryOrTagRowInterface } from '../interface/category-or-tag-row.interface';
import { translationProgressStore } from '../store/translation-progress.store';
import { aiLog } from '../utils/ai-log.util';

import { BaseDrainerService } from './base-drainer.service';
import { chatService } from './chat.service';

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
        aiLog('drainer:translation:row:begin', { kind: row.kind, id: row.id, title: row.title });
        const service = new TranslationLlmService(chatService);
        const result = await service.translate(row.title);
        if (row.kind === 'category') {
            await categoryRepository.updateTranslation(row.id, result.titleEn, result.titleTags);
        } else {
            await tagRepository.updateTranslation(row.id, result.titleEn, result.titleTags);
        }
        aiLog('drainer:translation:row:persisted', {
            kind: row.kind,
            id: row.id,
            titleEnLen: result.titleEn.length
        });
    }
}

export const translationDrainerService = new TranslationDrainerService();
