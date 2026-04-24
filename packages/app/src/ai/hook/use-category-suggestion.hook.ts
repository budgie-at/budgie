import { UseSuggestionReturnInterface } from '@budgie/ai';
import { CategoryEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';
import { aiLog } from '../utils/ai-log.util';

import { useEmbedding } from './use-embedding.hook';
import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseCategorySuggestionParams {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
}

export const useCategorySuggestion = (params: UseCategorySuggestionParams): UseSuggestionReturnInterface<CategoryEntityInterface> => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled } = params;

    const { status: embeddingStatus } = useEmbedding();
    const embeddingReady = embeddingStatus === AiSubsystemStatusEnum.READY;
    const { categories, isLoading: isCategoriesLoading } = useAllCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);
    const hasCategoriesLoaded = isNotEmptyArray(categories);

    const fetchSuggestions = async (): Promise<CategoryEntityInterface[]> => {
        const mccDescription = mccCategory?.fullDescription ?? null;
        aiLog('hook:suggestion:category:fetch:start', {
            transactionTitle,
            mccCategoryId,
            mccDescription,
            comment,
            aiContext,
            categoriesLength: categories.length
        });
        const results = await embeddingSuggestionService.suggestCategories(
            categories,
            transactionTitle,
            mccDescription,
            comment,
            aiContext,
            mccCategoryId
        );
        aiLog('hook:suggestion:category:fetch:done', { count: results.length, ids: results.map(category => category.id) });

        return results;
    };

    aiLog('hook:suggestion:category:hook:state', {
        enabled,
        embeddingStatus,
        embeddingReady,
        isMccLoading,
        isCategoriesLoading,
        hasCategoriesLoaded,
        categoriesLength: categories.length
    });

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [embeddingReady, !isMccLoading, !isCategoriesLoading, hasCategoriesLoaded],
        requestKeyParts: [transactionTitle, mccCategoryId, comment, aiContext, enabled, embeddingReady, categories.length],
        fetchSuggestions
    });

    return { status, suggestions };
};
