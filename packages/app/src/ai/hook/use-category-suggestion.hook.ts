import { UseSuggestionReturnInterface } from '@budgie/ai';
import { CategoryEntityInterface } from '@budgie/contracts';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { AiModeEnum } from '../enum/ai-mode.enum';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';
import { aiLog } from '../utils/ai-log.util';

import { useAi } from './use-ai.hook';
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

    const { mode } = useAi();
    const { categories, isLoading: isCategoriesLoading } = useAllCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasCategoriesLoaded = categories.length > 0;

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
            aiContext
        );
        aiLog('hook:suggestion:category:fetch:done', { count: results.length, ids: results.map(category => category.id) });

        return results;
    };

    const modeReady = mode === AiModeEnum.Ready;
    aiLog('hook:suggestion:category:hook:state', {
        enabled,
        modeReady,
        mode,
        isMccLoading,
        isCategoriesLoading,
        hasCategoriesLoaded,
        categoriesLength: categories.length
    });

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [modeReady, !isMccLoading, !isCategoriesLoading, hasCategoriesLoaded],
        requestKeyParts: [transactionTitle, mccCategoryId, comment, aiContext, enabled, modeReady, categories.length],
        fetchSuggestions
    });

    return { status, suggestions };
};
