import { UseSuggestionReturnInterface } from '@budgie/ai';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';

import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseCommentSuggestionParams {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
}

export const useCommentSuggestion = (params: UseCommentSuggestionParams): UseSuggestionReturnInterface<string> => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const { llm } = useLlmContext();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const fetchSuggestions = async (): Promise<string[]> => {
        const mccDescription = mccCategory?.fullDescription ?? null;

        return embeddingSuggestionService.suggestComments(llm, categoryId, transactionTitle, mccDescription, comment, aiContext);
    };

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [llm.isReady, !isMccLoading],
        requestKeyParts: [transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, llm.isReady],
        fetchSuggestions
    });

    return { status, suggestions };
};
