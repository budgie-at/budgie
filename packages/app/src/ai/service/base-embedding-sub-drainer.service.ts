import { serializeEmbedding } from '@budgie/ai';
import { EmbeddingPendingContextBaseInterface, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionRepository } from '../../@generic/drizzle/db/db';
import { PendingPersistInterface } from '../interface/pending-persist.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';

import { BaseDrainerService } from './base-drainer.service';
import { embeddingService } from './embedding.service';

import type { DB } from '@budgie/contracts';

export abstract class BaseEmbeddingSubDrainerService<
    TContext extends EmbeddingPendingContextBaseInterface
> extends BaseDrainerService<TContext> {
    private static readonly RELAXED_INTERVAL_MS = 2500;
    private static readonly RELAXED_BATCH_SIZE = 5;
    private static readonly BOOST_BATCH_SIZE = 15;
    private static readonly YIELD_EVERY_ROWS = 3;

    protected readonly relaxedIntervalMs = BaseEmbeddingSubDrainerService.RELAXED_INTERVAL_MS;
    protected readonly relaxedBatchSize = BaseEmbeddingSubDrainerService.RELAXED_BATCH_SIZE;
    protected readonly boostBatchSize = BaseEmbeddingSubDrainerService.BOOST_BATCH_SIZE;
    protected readonly yieldEveryRows = BaseEmbeddingSubDrainerService.YIELD_EVERY_ROWS;

    private readonly pendingPersists: Array<PendingPersistInterface<TContext>> = [];

    @Log(
        context => `enter transactionIds=${context.transactionIds.join(',')} existingEmbeddingId=${String(context.existingEmbeddingId)}`,
        'done',
        (error, context) => `throw transactionIds=${context.transactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    protected async processRow(context: TContext): Promise<void> {
        if (isDefined(context.existingEmbeddingId)) {
            this.pendingPersists.push({ context, embeddingId: context.existingEmbeddingId, skipped: true });

            return;
        }
        const embeddingId = await this.runEmbedAndUpsert(context);
        if (!isDefined(embeddingId)) {
            return;
        }
        this.pendingPersists.push({ context, embeddingId, skipped: false });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected override async afterBatch(): Promise<void> {
        if (isEmptyArray(this.pendingPersists)) {
            return;
        }
        const batch = this.pendingPersists.splice(0);
        const allTransactionIds = batch.flatMap(persist => persist.context.transactionIds);

        await transactionAsync(db, async tx => {
            for (const persist of batch) {
                // eslint-disable-next-line no-await-in-loop -- Sequential inside transaction to keep lock time bounded
                await this.replaceEmbeddingTags(persist.embeddingId, persist.context.tagIds, tx);
            }
            await transactionRepository.clearNeedsEmbedding(allTransactionIds, tx);
        });

        void embeddingProgressStore.refresh();
    }

    @Log(
        context => `enter transactionIds=${context.transactionIds.join(',')}`,
        result => `done dimensions=${result.length}`,
        (error, context) => `throw transactionIds=${context.transactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    private async embedContext(context: TContext): Promise<number[]> {
        return embeddingService.embed(this.buildPromptContext(context));
    }

    @Log(
        context => `enter transactionIds=${context.transactionIds.join(',')}`,
        result => `done embeddingId=${String(result)}`,
        (error, context) => `throw transactionIds=${context.transactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    private async upsertEmbedding(context: TContext, rawEmbedding: number[]): Promise<number | null> {
        const serialized = serializeEmbedding(new Float32Array(rawEmbedding));

        return this.persistEmbedding(context, serialized, rawEmbedding.length);
    }

    @Log(
        context => `enter transactionIds=${context.transactionIds.join(',')}`,
        (result, context) => `done transactionIds=${context.transactionIds.join(',')} embeddingId=${String(result)}`,
        (error, context) => `throw transactionIds=${context.transactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    private async runEmbedAndUpsert(context: TContext): Promise<number | null> {
        const rawEmbedding = await this.embedContext(context);
        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return this.upsertEmbedding(context, rawEmbedding);
    }

    protected subscribeToSubsystem(listener: () => void): () => void {
        return embeddingService.subscribe(listener);
    }

    protected isSubsystemReady(): boolean {
        return embeddingService.isReady;
    }

    protected abstract buildPromptContext(context: TContext): string;
    protected abstract persistEmbedding(context: TContext, embedding: Uint8Array, dimensions: number): Promise<number | null>;
    protected abstract replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void>;
}
