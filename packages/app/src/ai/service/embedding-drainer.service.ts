import { buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { PendingEmbeddingRowInterface } from '@budgie/contracts';
import { AppState, AppStateStatus } from 'react-native';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    categoryRepository,
    commentEmbeddingRepository,
    mccCategoryRepository,
    merchantEmbeddingRepository,
    transactionEmbeddingRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { aiLog } from '../utils/ai-log.util';

import { embeddingService } from './embedding.service';

const BATCH_SIZE = 10;
const DRAIN_INTERVAL_MS = 2_000;

interface RowContextInterface {
    readonly categoryId: number;
    readonly categoryTitle: string | null;
    readonly mccDescription: string;
    readonly tagIds: number[];
}

class EmbeddingDrainerService {
    private running = false;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;
    private embeddingUnsubscribe: (() => void) | null = null;
    private started = false;

    start(): void {
        if (this.started) {
            return;
        }
        aiLog('drainer:start');
        this.started = true;
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppState);
        this.embeddingUnsubscribe = embeddingService.subscribe(() => {
            const { status } = embeddingService.getSnapshot();
            if (status === AiSubsystemStatusEnum.Ready) {
                this.scheduleDrain();
            } else {
                this.haltDrain();
            }
        });
        if (embeddingService.isReady) {
            this.scheduleDrain();
        }
    }

    stop(): void {
        if (!this.started) {
            return;
        }
        aiLog('drainer:stop');
        this.started = false;
        this.haltDrain();
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        this.embeddingUnsubscribe?.();
        this.embeddingUnsubscribe = null;
    }

    private readonly handleAppState = (state: AppStateStatus): void => {
        aiLog('drainer:appstate:change', { to: state });
        if (state === 'active') {
            this.scheduleDrain();
        } else {
            this.haltDrain();
        }
    };

    private haltDrain(): void {
        aiLog('drainer:halt');
        this.running = false;
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private isSafe(): boolean {
        return embeddingService.isReady && AppState.currentState === 'active';
    }

    private scheduleDrain(): void {
        if (!this.started || this.running || !this.isSafe()) {
            return;
        }
        aiLog('drainer:schedule', { delayMs: DRAIN_INTERVAL_MS });
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.drain();
        }, DRAIN_INTERVAL_MS);
    }

    // eslint-disable-next-line max-statements -- Drain cycle: guard, fetch, process, refresh, reschedule
    private async drain(): Promise<void> {
        if (!this.isSafe()) {
            aiLog('drainer:row:skip:not-safe');

            return;
        }
        const started = Date.now();
        aiLog('drainer:drain:begin', { batchSize: BATCH_SIZE });

        this.running = true;
        try {
            const rows = await transactionEmbeddingRepository.findPending(BATCH_SIZE);
            if (rows.length === 0) {
                aiLog('drainer:drain:no-rows');

                return;
            }
            await this.processRows(rows);
            await embeddingProgressStore.refresh();
            aiLog('drainer:drain:complete', { durationMs: Date.now() - started, rows: rows.length });
        } catch (error: unknown) {
            aiLog('drainer:drain:error', { errorMessage: getErrorMessage(error) });
        } finally {
            this.running = false;
            if (this.isSafe()) {
                this.scheduleDrain();
            }
        }
    }

    private async processRows(rows: PendingEmbeddingRowInterface[]): Promise<void> {
        /* eslint-disable no-await-in-loop -- Sequential to avoid Metal thrash */
        for (const row of rows) {
            if (!this.started || !this.isSafe()) {
                aiLog('drainer:row:skip:not-safe', { rowId: row.id });
                break;
            }
            await this.processRow(row);
        }
        /* eslint-enable no-await-in-loop */
    }

    // eslint-disable-next-line max-statements -- Per-row flow: context, embed, persist, with structured logs
    private async processRow(row: PendingEmbeddingRowInterface): Promise<void> {
        aiLog('drainer:row:begin', { rowId: row.id });
        try {
            const context = await this.buildRowContext(row);
            if (context === null) {
                await transactionRepository.updateById(row.id, { needsEmbedding: false });
                aiLog('drainer:row:persisted', { rowId: row.id, skipped: 'no-context' });

                return;
            }

            aiLog('drainer:row:context', { rowId: row.id, categoryId: context.categoryId });

            const embedded = await this.resolveEmbedded(row, context);
            if (embedded) {
                await transactionRepository.updateById(row.id, { needsEmbedding: false });
                aiLog('drainer:row:persisted', { rowId: row.id });
            } else {
                aiLog('drainer:row:skip:not-safe', { rowId: row.id, reason: 'empty-embedding' });
            }
        } catch (error: unknown) {
            aiLog('drainer:row:throw', { rowId: row.id, errorMessage: getErrorMessage(error) });
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
        aiLog('drainer:row:embedded', { rowId: row.id, source: 'merchant', dimensions: rawEmbedding.length });

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
        aiLog('drainer:row:embedded', { rowId: row.id, source: 'comment', dimensions: rawEmbedding.length });

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
