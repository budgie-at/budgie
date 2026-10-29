import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { getCategorizeInboxPile } from '../../utils/get-categorize-inbox-pile.util';

export const CategorizeInboxPileLegend = () => {
    const { t } = useLingui();
    const { items, remainingCount, categorizedCount } = useCategorizeInboxContext();

    const { readyCount, largestReview } = getCategorizeInboxPile(items, remainingCount + categorizedCount);
    const largestName = isDefined(largestReview)
        ? (getCategorizeInboxJarName(largestReview.displayTitle) ?? largestReview.displayTitle)
        : '';
    const largestPercent = isPositiveNumber(remainingCount) ? Math.round(((largestReview?.rows.length ?? 0) / remainingCount) * 100) : 0;

    const readyText = isPositiveNumber(readyCount) ? t`${readyCount} ready` : null;
    const aloneText = isDefined(largestReview) ? t`«${largestName}» alone is ${largestPercent}%` : null;
    const sortedText = isPositiveNumber(categorizedCount) ? t`${categorizedCount} sorted` : aloneText;

    return (
        <View className="flex-row justify-between gap-x-xl">
            <Text className="text-xs font-medium text-positive-foreground tabular-nums" numberOfLines={1}>
                {readyText}
            </Text>
            <Text className="shrink text-xs text-secondary-foreground tabular-nums" numberOfLines={1}>
                {sortedText}
            </Text>
        </View>
    );
};
