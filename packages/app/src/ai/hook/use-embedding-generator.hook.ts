import { EmbeddingService, buildTransactionContext, serializeEmbedding } from '@budgie/ai';
import { TransactionCreateInputInterface } from '@budgie/contracts';

import { emptyFn, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { categoryRepository, mccCategoryRepository, tagRepository, titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../context/llm.context';

interface UseEmbeddingGeneratorReturn {
    readonly generateForTransaction: (title: string, comment: string, mccCategoryId: number | null) => void;
    readonly generateForTransactions: (transactions: readonly TransactionCreateInputInterface[]) => void;
}

interface EmbeddingTransactionContextInterface {
    readonly mccCategoryId: number | null;
    readonly categoryId: number | null;
    readonly tagIds: readonly number[];
}

// eslint-disable-next-line max-statements -- Debug logging
const generateAndStoreEmbedding = async (
    title: string,
    comment: string,
    transactionContext: EmbeddingTransactionContextInterface,
    embeddingService: EmbeddingService
): Promise<void> => {
    const start = performance.now();
    console.log(`[EmbedGen] generateAndStoreEmbedding START title="${title}"`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

    const mccCategory = isDefined(transactionContext.mccCategoryId)
        ? await mccCategoryRepository.findById(transactionContext.mccCategoryId)
        : null;
    const mccDescription = mccCategory?.fullDescription ?? null;

    const category = isDefined(transactionContext.categoryId) ? await categoryRepository.findById(transactionContext.categoryId) : null;
    const categoryName = category?.titleEn ?? category?.title ?? null;

    const tagIds = [...transactionContext.tagIds];
    const tags = isNotEmptyArray(tagIds) ? await tagRepository.findByIds(tagIds) : [];
    const tagNames = isNotEmptyArray(tags) ? tags.map(tag => tag.titleEn ?? tag.title).join(',') : null;

    const context = buildTransactionContext(title, mccDescription, comment, { categoryName, tagNames });
    console.log(`[EmbedGen] context built in ${(performance.now() - start).toFixed(0)}ms: "${context}"`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

    if (!isNotEmptyString(context)) {
        return;
    }

    const embedding = await embeddingService.generateEmbedding(context);
    console.log(`[EmbedGen] embedding generated in ${(performance.now() - start).toFixed(0)}ms, dims=${embedding?.length ?? 0}`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

    if (!isDefined(embedding)) {
        return;
    }

    const serialized = serializeEmbedding(embedding);
    await titleEmbeddingRepository.upsert(title, context, serialized, embedding.length);
    console.log(`[EmbedGen] upsert done in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console, lingui/no-unlocalized-strings
};

const generateAndStoreEmbeddings = async (
    transactions: readonly TransactionCreateInputInterface[],
    embeddingService: EmbeddingService
): Promise<void> => {
    const processed = new Set<string>();

    for (const transaction of transactions) {
        const key = `${transaction.title}|${transaction.comment}`;
        if (processed.has(key)) {
            continue; // eslint-disable-line no-continue -- Dedup by title+comment
        }

        processed.add(key);
        const transactionContext: EmbeddingTransactionContextInterface = {
            mccCategoryId: transaction.entries[0]?.mccCategoryId ?? null,
            categoryId: transaction.entries[0]?.categoryId ?? null,
            tagIds: transaction.tagIds
        };
        await generateAndStoreEmbedding(transaction.title, transaction.comment, transactionContext, embeddingService); // eslint-disable-line no-await-in-loop -- Sequential to avoid overwhelming LLM
    }
};

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturn => {
    const { llm } = useLlmContext();

    const generateForTransaction = (title: string, comment: string, mccCategoryId: number | null): void => {
        if (!llm.isReady) {
            return;
        }

        const embeddingService = new EmbeddingService(llm);
        generateAndStoreEmbedding(title, comment, { mccCategoryId, categoryId: null, tagIds: [] }, embeddingService).catch(emptyFn);
    };

    const generateForTransactions = (transactions: readonly TransactionCreateInputInterface[]): void => {
        if (!llm.isReady) {
            return;
        }

        const embeddingService = new EmbeddingService(llm);
        generateAndStoreEmbeddings(transactions, embeddingService).catch(emptyFn);
    };

    return { generateForTransaction, generateForTransactions };
};
