import { buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { PendingEmbeddingRowInterface } from '@budgie/contracts';
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
    private started = false;

    start(getMode: () => AiModeEnum, embed: (text: string) => Promise<number[]>): void {
        this.getMode = getMode;
        this.embed = embed;
        this.started = true;
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppState);
        this.scheduleDrain();
    }

    stop(): void {
        this.started = false;
        this.running = false;
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.appStateSubscription?.remove();
        this.appStateSubscription = null;
    }

    private getMode: () => AiModeEnum = () => AiModeEnum.Disabled;
    private embed: (text: string) => Promise<number[]> = async () => [];

    private readonly handleAppState = (state: AppStateStatus): void => {
        if (state === 'active') {
            this.scheduleDrain();
        } else if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    };

    private scheduleDrain(): void {
        if (!this.started || this.running || !isNativeCallSafe(this.getMode())) {
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

    private async drain(): Promise<void> {
        if (!isNativeCallSafe(this.getMode())) {
            return;
        }

        this.running = true;
        try {
            const rows = await transactionEmbeddingRepository.findPending(BATCH_SIZE);
            if (rows.length === 0) {
                return;
            }
            await this.processRows(rows);
            await embeddingProgressStore.refresh();
        } catch {
            emptyFn();
        } finally {
            this.running = false;
            this.scheduleDrain();
        }
    }

    private async processRows(rows: PendingEmbeddingRowInterface[]): Promise<void> {
        /* eslint-disable no-await-in-loop -- Sequential to avoid Metal thrash */
        for (const row of rows) {
            if (!this.started || !isNativeCallSafe(this.getMode())) {
                break;
            }
            await this.processRow(row);
        }
        /* eslint-enable no-await-in-loop */
    }

    private async processRow(row: PendingEmbeddingRowInterface): Promise<void> {
        const context = await this.buildRowContext(row);
        if (context === null) {
            await transactionRepository.updateById(row.id, { needsEmbedding: false });

            return;
        }

        const embedded = await this.resolveEmbedded(row, context);
        if (embedded) {
            await transactionRepository.updateById(row.id, { needsEmbedding: false });
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
        const rawEmbedding = await this.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            return false;
        }

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
        const rawEmbedding = await this.embed(promptContext);
        if (!isNotEmptyArray(rawEmbedding)) {
            return false;
        }

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
