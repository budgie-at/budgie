import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { CategorySuggestionLoadingPill } from '../category-suggestion-loading-pill/category-suggestion-loading-pill';
import { CategorySuggestionReadyPill } from '../category-suggestion-ready-pill/category-suggestion-ready-pill';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly amount: number;
    readonly comment: string;
    readonly variant: ColorPaletteVariant;
    readonly onApply: (categoryId: number) => void;
}

export const CategorySuggestionPill = (props: Props) => {
    const { transactionTitle, mccCategoryId, amount, comment, variant, onApply } = props;

    const { status, suggestedCategory } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        amount,
        comment,
        enabled: true
    });

    const isLoading = status === 'loading';
    const isReady = status === 'success' && isDefined(suggestedCategory);

    if (!isLoading && !isReady) {
        return null;
    }

    const handleApply = () => {
        if (isDefined(suggestedCategory)) {
            onApply(suggestedCategory.id);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(200).delay(100)} className="mt-sm">
            {isLoading && <CategorySuggestionLoadingPill />}
            {isReady && <CategorySuggestionReadyPill category={suggestedCategory} variant={variant} onPress={handleApply} />}
        </Animated.View>
    );
};
