import { UseSuggestionReturnInterface } from '@budgie/ai';
import { EmbeddingSuggestionService } from '@budgie/categorization';
import { CategoryEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { embeddingModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

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

    const embeddingStatus = useAtomValue(embeddingModelSnapshotAtom, snapshot => snapshot.status);
    const embeddingReady = embeddingStatus === AiSubsystemStatusEnum.READY;
    const { categories, isLoading: isCategoriesLoading } = useNonSystemCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);
    const hasCategoriesLoaded = isNotEmptyArray(categories);

    const fetchSuggestions = () => {
        const mccDescription = mccCategory?.fullDescription ?? null;

        return Effect.flatMap(EmbeddingSuggestionService, embeddingSuggestionService =>
            embeddingSuggestionService.suggestCategories(categories, transactionTitle, mccDescription, comment, aiContext, mccCategoryId)
        );
    };

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [embeddingReady, !isMccLoading, !isCategoriesLoading, hasCategoriesLoaded],
        requestKeyParts: [transactionTitle, mccCategoryId, comment, aiContext, enabled, embeddingReady, categories.length],
        fetchSuggestions
    });

    return { status, suggestions };
};
