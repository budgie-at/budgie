import { buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { PendingEmbeddingRowInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    categoryRepository,
    commentEmbeddingRepository,
    mccCategoryRepository,
    merchantEmbeddingRepository,
    transactionEmbeddingRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { aiLog } from '../utils/ai-log.util';

import { BaseDrainerService } from './base-drainer.service';
import { embeddingService } from './embedding.service';

const RELAXED_INTERVAL_MS = 500;
const RELAXED_BATCH_SIZE = 10;
const BOOST_BATCH_SIZE = 20;
const YIELD_EVERY_ROWS = 5;

interface RowContextInterface {
    readonly categoryId: number;
    readonly categoryTitle: string | null;
    readonly mccDescription: string;
    readonly tagIds: number[];
}

class EmbeddingDrainerService extends BaseDrainerService<PendingEmbeddingRowInterface> {
    protected readonly kind = DrainerKindEnum.Embedding;
    protected readonly logDomain = 'drainer:embedding';
    protected readonly relaxedIntervalMs = RELAXED_INTERVAL_MS;
    protected readonly relaxedBatchSize = RELAXED_BATCH_SIZE;
    protected readonly boostBatchSize = BOOST_BATCH_SIZE;
    protected readonly yieldEveryRows = YIELD_EVERY_ROWS;

    protected subscribeToSubsystem(listener: () => void): () => void {
        return embeddingService.subscribe(listener);
    }

    protected isSubsystemReady(): boolean {
        return embeddingService.isReady;
    }

    protected async fetchPending(limit: number): Promise<readonly PendingEmbeddingRowInterface[]> {
        return transactionEmbeddingRepository.findPending(limit);
    }

    protected async countPending(): Promise<number> {
        await embeddingProgressStore.refresh();

        return embeddingProgressStore.getSnapshot().pending;
    }

     
    protected async processRow(row: PendingEmbeddingRowInterface): Promise<void> {
        aiLog('drainer:embedding:row:begin', { rowId: row.id });
        const context = await this.buildRowContext(row);
        if (context === null) {
            await transactionRepository.updateById(row.id, { needsEmbedding: false });
            aiLog('drainer:embedding:row:persisted', { rowId: row.id, skipped: 'no-context' });

            return;
        }
        aiLog('drainer:embedding:row:context', { rowId: row.id, categoryId: context.categoryId });

        const embedded = await this.resolveEmbedded(row, context);
        if (embedded) {
            await transactionRepository.updateById(row.id, { needsEmbedding: false });
            aiLog('drainer:embedding:row:persisted', { rowId: row.id });
        } else {
            aiLog('drainer:embedding:row:skip', { rowId: row.id, reason: 'empty-embedding' });
        }
    }

    private async resolveEmbedded(row: PendingEmbeddingRowInterface, context: RowContextInterface): Promise<boolean> {
        if (isNotEmptyString(row.title)) {
            return this.embedMerchant(row, context);
        }
        if (isNotEmptyString(row.comment)) {
            return this.embedComment(row, context);
        }

        return true;
    }

    private async buildRowContext(row: PendingEmbeddingRowInterface): Promise<RowContextInterface | null> {
        const [entry] = row.entries;
        const { categoryId } = entry;
        const { mccCategoryId } = entry;

        if (!isPositiveNumber(categoryId)) {
            return null;
        }

        const categoryTitle = await this.lookupCategoryTitle(categoryId);
        const mccDescription = await this.lookupMccDescription(mccCategoryId);
        const tagIds = row.transactionTags.map(link => link.tagId);

        return { categoryId, categoryTitle, mccDescription, tagIds };
    }

    private async embedMerchant(row: PendingEmbeddingRowInterface, context: RowContextInterface): Promise<boolean> {
        const promptContext = buildMerchantContext({
            title: row.title,
            mccDescription: context.mccDescription,
            categoryTitle: context.categoryTitle
        });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            return false;
        }
        aiLog('drainer:embedding:row:embedded', { rowId: row.id, source: 'merchant', dimensions: rawEmbedding.length });

        const serialized = serializeEmbedding(new Float32Array(rawEmbedding));
        const embeddingId = await merchantEmbeddingRepository.upsert({
            title: row.title,
            mccDescription: context.mccDescription,
            categoryId: context.categoryId,
            comment: row.comment,
            embedding: serialized,
            dimensions: rawEmbedding.length
        });
        if (isDefined(embeddingId)) {
            await merchantEmbeddingRepository.replaceTags(embeddingId, context.tagIds);
        }

        return true;
    }

    private async embedComment(row: PendingEmbeddingRowInterface, context: RowContextInterface): Promise<boolean> {
        const promptContext = buildCommentContext({ comment: row.comment, categoryTitle: context.categoryTitle });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            return false;
        }
        aiLog('drainer:embedding:row:embedded', { rowId: row.id, source: 'comment', dimensions: rawEmbedding.length });

        const serialized = serializeEmbedding(new Float32Array(rawEmbedding));
        const embeddingId = await commentEmbeddingRepository.upsert({
            comment: row.comment,
            categoryId: context.categoryId,
            embedding: serialized,
            dimensions: rawEmbedding.length
        });
        if (isDefined(embeddingId)) {
            await commentEmbeddingRepository.replaceTags(embeddingId, context.tagIds);
        }

        return true;
    }

    private async lookupCategoryTitle(categoryId: number): Promise<string | null> {
        const category = await categoryRepository.findById(categoryId);

        return category?.titleEn ?? category?.title ?? null;
    }

    private async lookupMccDescription(mccCategoryId: number | null): Promise<string> {
        if (!isPositiveNumber(mccCategoryId)) {
            return '';
        }
        const mccCategory = await mccCategoryRepository.findById(mccCategoryId);

        return mccCategory?.fullDescription ?? '';
    }
}

export const embeddingDrainerService = new EmbeddingDrainerService();
