import { CategoryEntityInterface } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { buildCategorySuggestionPrompt } from '../util/build-category-suggestion-prompt.util';
import { buildTransactionContext } from '../util/build-transaction-context.util';
import { parseCategorySuggestionResponse } from '../util/parse-category-suggestion-response.util';

import { useLlm } from './use-llm.hook';

interface UseCategorySuggestionParams {
    transactionTitle: string;
    mccCategoryId: number | null;
    amount: number;
    comment: string;
    enabled: boolean;
}

type InternalStatus = 'idle' | 'loading' | 'success' | 'error';
type CategorySuggestionStatus = 'idle' | 'initializing' | 'loading' | 'success' | 'error';

interface UseCategorySuggestionReturn {
    status: CategorySuggestionStatus;
    suggestedCategory: CategoryEntityInterface | null;
}

export const useCategorySuggestion = (params: UseCategorySuggestionParams): UseCategorySuggestionReturn => {
    const { transactionTitle, mccCategoryId, amount, comment, enabled } = params;

    const { categories } = useAllCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const systemPrompt = buildCategorySuggestionPrompt(categories);
    const llm = useLlm({ systemPrompt });

    const [internalStatus, setInternalStatus] = useState<InternalStatus>('idle');
    const [suggestedCategory, setSuggestedCategory] = useState<CategoryEntityInterface | null>(null);

    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        if (!enabled || !llm.isReady || isMccLoading || hasTriggeredRef.current) {
            return;
        }

        hasTriggeredRef.current = true;

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const context = buildTransactionContext({
                    title: transactionTitle,
                    mccDescription: mccCategory?.shortDescription ?? null,
                    amount,
                    comment
                });

                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- DEBUG
                console.log('LLM system prompt:', systemPrompt);
                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- DEBUG
                console.log('LLM context:', context);
                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- DEBUG
                console.log('MCC category:', mccCategory);
                const response = await llm.sendMessage(context);
                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- DEBUG
                console.log('LLM response:', response);
                const categoryId = parseCategorySuggestionResponse(response, categories);
                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- DEBUG
                console.log('Parsed categoryId:', categoryId);
                const category = isDefined(categoryId) ? (categories.find(item => item.id === categoryId) ?? null) : null;

                setSuggestedCategory(category);
                setInternalStatus(isDefined(category) ? 'success' : 'error');
            } catch (error) {
                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings -- DEBUG
                console.log('LLM error:', error);
                setInternalStatus('error');
            }
        };

        void suggest();
    }, [enabled, llm.isReady, isMccLoading]);

    const isWaitingForLlm = enabled && (!llm.isReady || isMccLoading) && internalStatus === 'idle';
    const status: CategorySuggestionStatus = isWaitingForLlm ? 'initializing' : internalStatus;

    return { status, suggestedCategory };
};
