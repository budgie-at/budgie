import { buildMerchantContext } from '@budgie/ai';
import { getLogger } from '@budgie/logger';

import { isDefined } from '@rnw-community/shared';

import { merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';

import { BaseEmbeddingSubDrainerService } from './base-embedding-sub-drainer.service';

import type { DB, MerchantPendingContextInterface } from '@budgie/contracts';

const merchantDrainerLogger = getLogger('MerchantEmbeddingDrainerService');

class MerchantEmbeddingDrainerService extends BaseEmbeddingSubDrainerService<MerchantPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EMBEDDING_MERCHANT;

    protected buildPromptContext(context: MerchantPendingContextInterface): string {
        return buildMerchantContext({
            title: context.title,
            mccDescription: context.mccDescription,
            categoryTitle: context.categoryTitleEn
        });
    }

    protected async persistEmbedding(
        context: MerchantPendingContextInterface,
        embedding: Uint8Array,
        dimensions: number
    ): Promise<number | null> {
        return merchantEmbeddingRepository.upsert({
            title: context.title,
            mccDescription: context.mccDescription,
            categoryId: context.categoryId,
            comment: context.comment,
            embedding,
            dimensions
        });
    }

    protected async fetchPending(limit: number): Promise<MerchantPendingContextInterface[]> {
        return merchantEmbeddingRepository.findPendingMerchantContexts(limit);
    }

    protected async countPending(): Promise<number> {
        return merchantEmbeddingRepository.countPendingMerchantContexts();
    }

    protected logBegin(context: MerchantPendingContextInterface): void {
        merchantDrainerLogger.log('embedding:merchant:context:begin', {
            title: context.title,
            categoryId: context.categoryId,
            contextSize: context.transactionIds.length,
            hasExisting: isDefined(context.existingEmbeddingId)
        });
    }

    protected logSkip(context: MerchantPendingContextInterface, reason: string): void {
        merchantDrainerLogger.log('embedding:merchant:context:skip', {
            reason,
            contextSize: context.transactionIds.length
        });
    }

    protected async replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return merchantEmbeddingRepository.replaceTags(embeddingId, tagIds, tx);
    }
}

export const merchantEmbeddingDrainerService = new MerchantEmbeddingDrainerService();
