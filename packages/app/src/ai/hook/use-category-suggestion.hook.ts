import { CategoryEntityInterface } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';
import { CategoryLlmService } from '../service/category-llm.service';

interface UseCategorySuggestionParams {
    transactionTitle: string;
    mccCategoryId: number | null;
    comment: string;
    enabled: boolean;
}

type InternalStatus = 'idle' | 'loading' | 'success' | 'error';
type CategorySuggestionStatus = 'idle' | 'initializing' | 'loading' | 'success' | 'error';

interface UseCategorySuggestionReturn {
    status: CategorySuggestionStatus;
    suggestedCategories: CategoryEntityInterface[];
}

export const useCategorySuggestion = (params: UseCategorySuggestionParams): UseCategorySuggestionReturn => {
    const { transactionTitle, mccCategoryId, comment, enabled } = params;

    const { llm } = useLlmContext();
    const { categories, isLoading: isCategoriesLoading } = useAllCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const [internalStatus, setInternalStatus] = useState<InternalStatus>('idle');
    const [suggestedCategories, setSuggestedCategories] = useState<CategoryEntityInterface[]>([]);

    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        if (!enabled || !llm.isReady || isMccLoading || isCategoriesLoading || hasTriggeredRef.current) {
            return;
        }

        hasTriggeredRef.current = true;

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const service = new CategoryLlmService(llm);
                const results = await service.suggestCategories({
                    transactionTitle,
                    mccDescription: mccCategory?.fullDescription ?? null,
                    comment,
                    categories
                });

                setSuggestedCategories(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch {
                setInternalStatus('error');
            }
        };

        void suggest();
    }, [enabled, llm.isReady, isMccLoading, isCategoriesLoading]);

    const isWaitingForLlm = enabled && (!llm.isReady || isMccLoading || isCategoriesLoading) && internalStatus === 'idle';
    const status: CategorySuggestionStatus = isWaitingForLlm ? 'initializing' : internalStatus;

    return { status, suggestedCategories };
};
