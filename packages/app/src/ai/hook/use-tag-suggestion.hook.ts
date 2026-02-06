import { TagEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../category/query/use-get-category-by-id.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { useLlmContext } from '../context/llm.context';
import { UseSuggestionReturnInterface } from '../interface/use-suggestion-return.interface';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';
import { TagLlmService } from '../service/tag-llm.service';
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseTagSuggestionParams {
    transactionTitle: string;
    categoryId: number;
    mccCategoryId: number | null;
    comment: string;
    aiContext: string;
    enabled: boolean;
}

export const useTagSuggestion = (params: UseTagSuggestionParams): UseSuggestionReturnInterface<TagEntityInterface> => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const { llm } = useLlmContext();
    const { tags: allTags, isLoading: isTagsLoading } = useSearchTagsQuery('');
    const { category, isLoading: isCategoryLoading } = useGetCategoryByIdQuery(categoryId);
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTagsLoaded = isNotEmptyArray(allTags);
    const isReady = enabled && llm.isReady && !isCategoryLoading && !isMccLoading && !isTagsLoading && hasTagsLoaded;

    const fetchSuggestions = async (): Promise<TagEntityInterface[]> => {
        if (!isNotEmptyArray(allTags)) {
            return [];
        }

        const suggestionComment = isNotEmptyString(aiContext) ? aiContext : comment;
        const mccDescription = mccCategory?.fullDescription ?? null;
        const categoryName = category?.titleEn ?? category?.title ?? null;
        const context = buildTransactionContext(transactionTitle, mccDescription, suggestionComment, categoryName);

        const embeddingResults = await embeddingSuggestionService.suggestTags(context, llm, allTags);

        if (isNotEmptyArray(embeddingResults)) {
            return embeddingResults;
        }

        const service = new TagLlmService(llm);

        return service.suggestTags({
            transactionTitle,
            categoryName,
            mccDescription,
            comment: suggestionComment,
            tags: allTags
        });
    };

    return useSuggestionBase({
        enabled,
        isReady,
        fetchSuggestions
    });
};
