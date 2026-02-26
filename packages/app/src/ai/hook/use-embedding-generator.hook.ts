import { EmbeddingService, buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { TransactionCreateInputInterface } from '@budgie/contracts';

import { emptyFn, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    categoryRepository,
    commentEmbeddingRepository,
    mccCategoryRepository,
    merchantEmbeddingRepository,
    tagRepository
} from '../../@generic/drizzle/db/db';
import { useAiEmbeddingProgressContext } from '../context/ai-embedding-progress.context';
import { useLlmContext } from '../context/llm.context';

interface EmbeddingTransactionParamsInterface {
    readonly title: string;
    readonly comment: string;
    readonly mccCategoryId: number | null;
    readonly categoryId: number | null;
    readonly tagIds: number[];
}

interface UseEmbeddingGeneratorReturn {
    readonly generateForTransaction: (params: EmbeddingTransactionParamsInterface) => void;
    readonly generateForTransactions: (transactions: readonly TransactionCreateInputInterface[]) => void;
}

const lookupCategoryTitle = async (categoryId: number | null): Promise<string | null> => {
    if (!isPositiveNumber(categoryId)) {
        return null;
    }

    const category = await categoryRepository.findById(categoryId);

    return category?.titleEn ?? category?.title ?? null;
};

const lookupMccDescription = async (mccCategoryId: number | null): Promise<string> => {
    if (!isPositiveNumber(mccCategoryId)) {
        return '';
    }

    const mccCategory = await mccCategoryRepository.findById(mccCategoryId);

    return mccCategory?.fullDescription ?? '';
};

const lookupTagIds = async (tagIds: number[]): Promise<number[]> => {
    if (!isNotEmptyArray(tagIds)) {
        return [];
    }

    const tags = await tagRepository.findByIds([...tagIds]);

    return tags.map(tag => tag.id);
};

const generateAndStoreForContext = async (
    context: string,
    embeddingService: EmbeddingService,
    upsertEmbedding: (serialized: Uint8Array, dimensions: number) => Promise<number | null>,
    replaceTagsIfNeeded: (embeddingId: number) => Promise<void>
): Promise<void> => {
    if (!isNotEmptyString(context)) {
        return;
    }

    const embedding = await embeddingService.generateEmbedding(context);

    if (!isDefined(embedding)) {
        return;
    }

    const serialized = serializeEmbedding(embedding);
    const embeddingId = await upsertEmbedding(serialized, embedding.length);

    if (isDefined(embeddingId)) {
        await replaceTagsIfNeeded(embeddingId);
    }
};

const generateAndStoreEmbedding = async (
    params: EmbeddingTransactionParamsInterface,
    embeddingService: EmbeddingService
): Promise<void> => {
    if (!isPositiveNumber(params.categoryId)) {
        return;
    }

    const { categoryId } = params;
    const categoryTitle = await lookupCategoryTitle(categoryId);
    const mccDescription = await lookupMccDescription(params.mccCategoryId);
    const resolvedTagIds = await lookupTagIds(params.tagIds);
    const hasMerchantTitle = isNotEmptyString(params.title);

    if (hasMerchantTitle) {
        const context = buildMerchantContext({ title: params.title, mccDescription, categoryTitle });

        await generateAndStoreForContext(
            context,
            embeddingService,
            (serialized, dimensions) =>
                merchantEmbeddingRepository.upsert({
                    title: params.title,
                    mccDescription,
                    categoryId,
                    comment: params.comment,
                    embedding: serialized,
                    dimensions
                }),
            embeddingId => merchantEmbeddingRepository.replaceTags(embeddingId, resolvedTagIds)
        );
    } else if (isNotEmptyString(params.comment)) {
        const context = buildCommentContext({ comment: params.comment, categoryTitle });

        await generateAndStoreForContext(
            context,
            embeddingService,
            (serialized, dimensions) =>
                commentEmbeddingRepository.upsert({ comment: params.comment, categoryId, embedding: serialized, dimensions }),
            embeddingId => commentEmbeddingRepository.replaceTags(embeddingId, resolvedTagIds)
        );
    }
};

const generateAndStoreEmbeddings = async (
    transactions: readonly TransactionCreateInputInterface[],
    embeddingService: EmbeddingService
): Promise<void> => {
    const processed = new Set<string>();

    /* eslint-disable no-await-in-loop -- Sequential to avoid overwhelming LLM */
    for (const transaction of transactions) {
        const key = `${transaction.title}|${transaction.comment}|${transaction.entries[0]?.categoryId ?? ''}`;

        if (!processed.has(key)) {
            processed.add(key);
            const embeddingParams: EmbeddingTransactionParamsInterface = {
                title: transaction.title,
                comment: transaction.comment,
                mccCategoryId: transaction.entries[0]?.mccCategoryId ?? null,
                categoryId: transaction.entries[0]?.categoryId ?? null,
                tagIds: transaction.tagIds
            };
            await generateAndStoreEmbedding(embeddingParams, embeddingService);
        }
    }
    /* eslint-enable no-await-in-loop */
};

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturn => {
    const { llm } = useLlmContext();
    const { refreshProgress } = useAiEmbeddingProgressContext();

    const generateForTransaction = (params: EmbeddingTransactionParamsInterface): void => {
        if (!llm.isEmbeddingReady) {
            return;
        }

        const embeddingService = new EmbeddingService(llm);
        generateAndStoreEmbedding(params, embeddingService).then(refreshProgress).catch(emptyFn);
    };

    const generateForTransactions = (transactions: readonly TransactionCreateInputInterface[]): void => {
        if (!llm.isEmbeddingReady) {
            return;
        }

        const embeddingService = new EmbeddingService(llm);
        generateAndStoreEmbeddings(transactions, embeddingService).then(refreshProgress).catch(emptyFn);
    };

    return { generateForTransaction, generateForTransactions };
};
