import { CategoryEntityInterface } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';
import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '../interface/suggestion.interface';
import { CategoryLlmService } from '../service/category-llm.service';

interface UseCategorySuggestionParams {
    transactionTitle: string;
    mccCategoryId: number | null;
    comment: string;
    aiContext: string;
    enabled: boolean;
}

export const useCategorySuggestion = (params: UseCategorySuggestionParams): UseSuggestionReturnInterface<CategoryEntityInterface> => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled } = params;

    const { llm } = useLlmContext();
    const { categories, isLoading: isCategoriesLoading } = useAllCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestedCategories, setSuggestedCategories] = useState<CategoryEntityInterface[]>([]);

    const hasTriggeredRef = useRef(false);

    const hasCategoriesLoaded = categories.length > 0;
    const isReady = enabled && llm.isReady && !isMccLoading && !isCategoriesLoading && hasCategoriesLoaded;

    /* jscpd:ignore-start -- Category suggestion hook mirrors tag suggestion hook pattern */
    useEffect(() => {
        if (!isReady || hasTriggeredRef.current) {
            return;
        }

        hasTriggeredRef.current = true;

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const service = new CategoryLlmService(llm);
                const suggestionComment = isNotEmptyString(aiContext) ? aiContext : comment;
                const results = await service.suggestCategories({
                    transactionTitle,
                    mccDescription: mccCategory?.fullDescription ?? null,
                    comment: suggestionComment,
                    categories
                });

                setSuggestedCategories(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch {
                setInternalStatus('error');
            }
        };

        void suggest();
    }, [isReady]);
    /* jscpd:ignore-end */

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions: suggestedCategories };
};
