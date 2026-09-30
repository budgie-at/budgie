import { EmbeddingSuggestionService, UseSuggestionReturnInterface } from '@budgie/ai';
import { TagEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { embeddingModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseTagSuggestionParams {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
}

export const useTagSuggestion = (params: UseTagSuggestionParams): UseSuggestionReturnInterface<TagEntityInterface> => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const embeddingStatus = useAtomValue(embeddingModelSnapshotAtom, snapshot => snapshot.status);
    const embeddingReady = embeddingStatus === AiSubsystemStatusEnum.READY;
    const { tags: allTags, isLoading: isTagsLoading } = useSearchTagsQuery('');
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTagsLoaded = isNotEmptyArray(allTags);

    const fetchSuggestions = () => {
        if (!isNotEmptyArray(allTags)) {
            return Effect.succeed([]);
        }

        const mccDescription = mccCategory?.fullDescription ?? null;

        return Effect.flatMap(EmbeddingSuggestionService, embeddingSuggestionService =>
            embeddingSuggestionService.suggestTags(allTags, categoryId, transactionTitle, mccDescription, comment, aiContext)
        );
    };

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [embeddingReady, !isMccLoading, !isTagsLoading, hasTagsLoaded],
        requestKeyParts: [transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, embeddingReady, allTags?.length ?? 0],
        fetchSuggestions
    });

    return { status, suggestions };
};
