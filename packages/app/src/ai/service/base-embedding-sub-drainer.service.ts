import { EmbeddingPendingContextBaseInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { aiLog } from '../utils/ai-log.util';

import { BaseDrainerService } from './base-drainer.service';
import { embeddingService } from './embedding.service';

const RELAXED_INTERVAL_MS = 2500;
const RELAXED_BATCH_SIZE = 5;
const BOOST_BATCH_SIZE = 15;
const YIELD_EVERY_ROWS = 3;

export abstract class BaseEmbeddingSubDrainerService<
    TContext extends EmbeddingPendingContextBaseInterface
> extends BaseDrainerService<TContext> {
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

    protected async processRow(context: TContext): Promise<void> {
        this.logBegin(context);
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

    private async persistWithSkip(context: TContext, embeddingId: number): Promise<void> {
        aiLog(`${this.logDomain}:context:skip`, {
            reason: 'preflight-hit',
            contextSize: context.transactionIds.length,
            embeddingId
        });
        await this.persistEmbedding(context, embeddingId, true);
    }

    private async persistEmbedding(context: TContext, embeddingId: number, skipped: boolean): Promise<void> {
        await this.replaceEmbeddingTags(embeddingId, context.tagIds);
        await transactionRepository.clearNeedsEmbedding(context.transactionIds);

        aiLog(`${this.logDomain}:context:persisted`, {
            embeddingId,
            contextSize: context.transactionIds.length,
            clearedFlags: context.transactionIds.length,
            skipped
        });
    }

    protected abstract logBegin(context: TContext): void;
    protected abstract runEmbedAndUpsert(context: TContext): Promise<number | null>;
    protected abstract replaceEmbeddingTags(embeddingId: number, tagIds: number[]): Promise<void>;
}
