import { buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { AppState, AppStateStatus } from 'react-native';

import { emptyFn, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    categoryRepository,
    commentEmbeddingRepository,
    mccCategoryRepository,
    merchantEmbeddingRepository,
    transactionEmbeddingRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { AiModeEnum } from '../enum/ai-mode.enum';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { isNativeCallSafe } from '../utils/is-native-call-safe.util';

import type { PendingEmbeddingRowInterface } from '@budgie/contracts';

const BATCH_SIZE = 10;
const DRAIN_INTERVAL_MS = 2_000;

interface DrainerDepsInterface {
    readonly getMode: () => AiModeEnum;
    readonly embed: (text: string) => Promise<number[]>;
    readonly refreshProgress: () => void;
}

class EmbeddingDrainerService {
    private running = false;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private appStateSubscription: { remove: () => void } | null = null;
    private deps: DrainerDepsInterface | null = null;

    start(deps: DrainerDepsInterface): void {
        this.deps = deps;
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppState);
        this.scheduleDrain();
    }

    stop(): void {
        this.running = false;
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
        this.deps = null;
    }

    private readonly handleAppState = (state: AppStateStatus): void => {
        if (state === 'active') {
            this.scheduleDrain();
        } else if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    };

    private scheduleDrain(): void {
        if (this.running) {
            return;
        }
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.drain();
        }, DRAIN_INTERVAL_MS);
    }

    // eslint-disable-next-line max-statements -- Drain loop with guard checks, error recovery, and rescheduling
    private async drain(): Promise<void> {
        if (this.deps === null) {
            return;
        }
        if (!isNativeCallSafe(this.deps.getMode())) {
            return;
        }

        this.running = true;
        try {
            const rows = await transactionEmbeddingRepository.findPending(BATCH_SIZE);

            if (rows.length === 0) {
                return;
            }

            /* eslint-disable no-await-in-loop -- Sequential to avoid Metal thrash */
            for (const row of rows) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- deps can be cleared between awaits
                if (this.deps === null) {
                    break;
                }
                if (!isNativeCallSafe(this.deps.getMode())) {
                    break;
                }
                await this.processRow(row);
            }
            /* eslint-enable no-await-in-loop */

            void embeddingProgressStore.refresh();
        } catch {
            emptyFn();
        } finally {
            this.running = false;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- deps can be cleared between awaits
            if (this.deps !== null && isNativeCallSafe(this.deps.getMode())) {
                this.scheduleDrain();
            }
        }
    }

    // eslint-disable-next-line max-statements -- Handles merchant and comment embeddings with tag replacement
    private async processRow(row: PendingEmbeddingRowInterface): Promise<void> {
        if (this.deps === null) {
            return;
        }

        const [entry] = row.entries;
        const { categoryId } = entry;
        const { mccCategoryId } = entry;

        if (!isPositiveNumber(categoryId)) {
            await transactionRepository.updateById(row.id, { needsEmbedding: false });

            return;
        }

        const categoryTitle = await this.lookupCategoryTitle(categoryId);
        const mccDescription = await this.lookupMccDescription(mccCategoryId);
        const tagIds = row.transactionTags.map(link => link.tagId);

        let embedded = false;

        if (isNotEmptyString(row.title)) {
            const context = buildMerchantContext({ title: row.title, mccDescription, categoryTitle });
            const rawEmbedding = await this.deps.embed(context);
            if (isNotEmptyArray(rawEmbedding)) {
                const float32Embedding = new Float32Array(rawEmbedding);
                const serialized = serializeEmbedding(float32Embedding);
                const embeddingId = await merchantEmbeddingRepository.upsert({
                    title: row.title,
                    mccDescription,
                    categoryId,
                    comment: row.comment,
                    embedding: serialized,
                    dimensions: rawEmbedding.length
                });
                if (isDefined(embeddingId)) {
                    await merchantEmbeddingRepository.replaceTags(embeddingId, tagIds);
                }
                embedded = true;
            }
        } else if (isNotEmptyString(row.comment)) {
            const context = buildCommentContext({ comment: row.comment, categoryTitle });
            const rawEmbedding = await this.deps.embed(context);
            if (isNotEmptyArray(rawEmbedding)) {
                const float32Embedding = new Float32Array(rawEmbedding);
                const serialized = serializeEmbedding(float32Embedding);
                const embeddingId = await commentEmbeddingRepository.upsert({
                    comment: row.comment,
                    categoryId,
                    embedding: serialized,
                    dimensions: rawEmbedding.length
                });
                if (isDefined(embeddingId)) {
                    await commentEmbeddingRepository.replaceTags(embeddingId, tagIds);
                }
                embedded = true;
            }
        } else {
            embedded = true;
        }

        if (embedded) {
            await transactionRepository.updateById(row.id, { needsEmbedding: false });
        }
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
