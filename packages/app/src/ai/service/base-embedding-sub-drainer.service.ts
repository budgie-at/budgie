import { EmbeddingPendingContextBaseInterface, Log, transactionAsync } from '@budgie/contracts';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { db, transactionRepository } from '../../@generic/drizzle/db/db';
import { PendingPersistInterface } from '../interface/pending-persist.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';

import { BaseDrainerService } from './base-drainer.service';
import { embeddingService } from './embedding.service';

import type { DB } from '@budgie/contracts';

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

    private readonly pendingPersists: Array<PendingPersistInterface<TContext>> = [];

    @Log(
        context => `enter contextSize=${context.transactionIds.length} existingEmbeddingId=${String(context.existingEmbeddingId)}`,
        'done',
        (error, context) => `throw contextSize=${context.transactionIds.length} error=${String(error)}`
    )
    protected async processRow(context: TContext): Promise<void> {
        this.logBegin(context);
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

    @Log('enter', 'done', error => `throw error=${String(error)}`)
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

    protected subscribeToSubsystem(listener: () => void): () => void {
        return embeddingService.subscribe(listener);
    }

    protected isSubsystemReady(): boolean {
        return embeddingService.isReady;
    }

    protected abstract logBegin(context: TContext): void;
    protected abstract runEmbedAndUpsert(context: TContext): Promise<number | null>;
    protected abstract replaceEmbeddingTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void>;
}
