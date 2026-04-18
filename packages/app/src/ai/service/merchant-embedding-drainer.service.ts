import { buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { MerchantPendingContextInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { merchantEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { DrainerKindEnum } from '../enum/drainer-kind.enum';
import { aiLog } from '../utils/ai-log.util';

import { BaseDrainerService } from './base-drainer.service';
import { embeddingService } from './embedding.service';

const RELAXED_INTERVAL_MS = 500;
const RELAXED_BATCH_SIZE = 5;
const BOOST_BATCH_SIZE = 15;
const YIELD_EVERY_ROWS = 3;

class MerchantEmbeddingDrainerService extends BaseDrainerService<MerchantPendingContextInterface> {
    protected readonly kind = DrainerKindEnum.EmbeddingMerchant;
    protected readonly logDomain = 'drainer:embedding:merchant';
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

    protected async fetchPending(limit: number): Promise<readonly MerchantPendingContextInterface[]> {
        return merchantEmbeddingRepository.findPendingMerchantContexts(limit);
    }

    protected async countPending(): Promise<number> {
        return merchantEmbeddingRepository.countPendingMerchantContexts();
    }

    protected async processRow(context: MerchantPendingContextInterface): Promise<void> {
        aiLog('drainer:embedding:merchant:context:begin', {
            title: context.title,
            categoryId: context.categoryId,
            contextSize: context.transactionIds.length,
            hasExisting: isDefined(context.existingEmbeddingId)
        });

        if (isDefined(context.existingEmbeddingId)) {
            await this.persistWithSkip(context, context.existingEmbeddingId);

            return;
        }

        const embeddingId = await this.runEmbedAndUpsert(context);
        if (!isDefined(embeddingId)) {
            return;
        }

        await this.persistEmbedding(context, embeddingId, false);
    }

    private async runEmbedAndUpsert(context: MerchantPendingContextInterface): Promise<number | null> {
        const promptContext = buildMerchantContext({
            title: context.title,
            mccDescription: context.mccDescription,
            categoryTitle: context.categoryTitleEn
        });
        const rawEmbedding = await embeddingService.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            aiLog('drainer:embedding:merchant:context:skip', {
                reason: 'empty-embedding',
                contextSize: context.transactionIds.length
            });

            return null;
        }

        aiLog('drainer:embedding:merchant:context:embedded', {
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
            aiLog('drainer:embedding:merchant:context:skip', {
                reason: 'upsert-null',
                contextSize: context.transactionIds.length
            });
        }

        return embeddingId;
    }

    private async persistWithSkip(context: MerchantPendingContextInterface, embeddingId: number): Promise<void> {
        aiLog('drainer:embedding:merchant:context:skip', {
            reason: 'preflight-hit',
            contextSize: context.transactionIds.length,
            embeddingId
        });
        await this.persistEmbedding(context, embeddingId, true);
    }

    private async persistEmbedding(
        context: MerchantPendingContextInterface,
        embeddingId: number,
        skipped: boolean
    ): Promise<void> {
        await merchantEmbeddingRepository.replaceTags(embeddingId, context.tagIds);
        await transactionRepository.clearNeedsEmbedding(context.transactionIds);

        aiLog('drainer:embedding:merchant:context:persisted', {
            embeddingId,
            contextSize: context.transactionIds.length,
            clearedFlags: context.transactionIds.length,
            skipped
        });
    }
}

export const merchantEmbeddingDrainerService = new MerchantEmbeddingDrainerService();
