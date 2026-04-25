import { buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { Log, getLogger } from '@budgie/contracts';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';

import { BaseEmbeddingSubDrainerService } from './base-embedding-sub-drainer.service';
import { embeddingService } from './embedding.service';

import type { DB, MerchantPendingContextInterface } from '@budgie/contracts';

const merchantDrainerLogger = getLogger('MerchantEmbeddingDrainerService');

class MerchantEmbeddingDrainerService extends BaseEmbeddingSubDrainerService<MerchantPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EMBEDDING_MERCHANT;
    protected readonly logDomain = 'drainer:embedding:merchant';

    @Log(
        context => `enter contextSize=${context.transactionIds.length}`,
        (result, context) => `done contextSize=${context.transactionIds.length} dimensions=${result.length}`,
        (error, context) => `throw contextSize=${context.transactionIds.length} error=${getErrorMessage(error)}`
    )
    private async embedMerchantContext(context: MerchantPendingContextInterface): Promise<number[]> {
        const promptContext = buildMerchantContext({
            title: context.title,
            mccDescription: context.mccDescription,
            categoryTitle: context.categoryTitleEn
        });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            merchantDrainerLogger.log('embedding:merchant:context:skip', {
                reason: 'empty-embedding',
                contextSize: context.transactionIds.length
            });
        }

        return rawEmbedding;
    }

    @Log(
        context => `enter contextSize=${context.transactionIds.length}`,
        (result, context) => `done contextSize=${context.transactionIds.length} embeddingId=${String(result)}`,
        (error, context) => `throw contextSize=${context.transactionIds.length} error=${getErrorMessage(error)}`
    )
    private async upsertMerchantEmbedding(context: MerchantPendingContextInterface, rawEmbedding: number[]): Promise<number | null> {
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
            merchantDrainerLogger.log('embedding:merchant:context:skip', {
                reason: 'upsert-null',
                contextSize: context.transactionIds.length
            });
        }

        return embeddingId;
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

    protected async runEmbedAndUpsert(context: MerchantPendingContextInterface): Promise<number | null> {
        const rawEmbedding = await this.embedMerchantContext(context);
        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return this.upsertMerchantEmbedding(context, rawEmbedding);
    }

    protected async replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return merchantEmbeddingRepository.replaceTags(embeddingId, tagIds, tx);
    }
}

export const merchantEmbeddingDrainerService = new MerchantEmbeddingDrainerService();
