import { buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { LoggerNamespaceEnum, MerchantPendingContextInterface, getLogger } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';

import { BaseEmbeddingSubDrainerService } from './base-embedding-sub-drainer.service';
import { embeddingService } from './embedding.service';

import type { DB } from '@budgie/contracts';

const logger = getLogger(LoggerNamespaceEnum.DRAINER);

class MerchantEmbeddingDrainerService extends BaseEmbeddingSubDrainerService<MerchantPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EMBEDDING_MERCHANT;
    protected readonly logDomain = 'drainer:embedding:merchant';

    protected async fetchPending(limit: number): Promise<MerchantPendingContextInterface[]> {
        return merchantEmbeddingRepository.findPendingMerchantContexts(limit);
    }

    protected async countPending(): Promise<number> {
        return merchantEmbeddingRepository.countPendingMerchantContexts();
    }

    protected logBegin(context: MerchantPendingContextInterface): void {
        logger.log('embedding:merchant:context:begin', {
            title: context.title,
            categoryId: context.categoryId,
            contextSize: context.transactionIds.length,
            hasExisting: isDefined(context.existingEmbeddingId)
        });
    }

    protected async runEmbedAndUpsert(context: MerchantPendingContextInterface): Promise<number | null> {
        const promptContext = buildMerchantContext({
            title: context.title,
            mccDescription: context.mccDescription,
            categoryTitle: context.categoryTitleEn
        });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            logger.log('embedding:merchant:context:skip', {
                reason: 'empty-embedding',
                contextSize: context.transactionIds.length
            });

            return null;
        }

        logger.log('embedding:merchant:context:embedded', {
            dimensions: rawEmbedding.length,
            contextSize: context.transactionIds.length
        });

        const serialized = serializeEmbedding(new Float32Array(rawEmbedding));
        const embeddingId = await merchantEmbeddingRepository.upsert({
            title: context.title,
            mccDescription: context.mccDescription,
            categoryId: context.categoryId,
            comment: context.comment,
            embedding: serialized,
            dimensions: rawEmbedding.length
        });
        if (!isDefined(embeddingId)) {
            logger.log('embedding:merchant:context:skip', {
                reason: 'upsert-null',
                contextSize: context.transactionIds.length
            });
        }

        return embeddingId;
    }

    protected async replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return merchantEmbeddingRepository.replaceTags(embeddingId, tagIds, tx);
    }
}

export const merchantEmbeddingDrainerService = new MerchantEmbeddingDrainerService();
