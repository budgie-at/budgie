import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CATEGORIZE_INBOX_SORTED_CLASS_NAME } from '../../constant/categorize-inbox-section-dot.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxPile } from '../../utils/get-categorize-inbox-pile.util';
import { CategorizeInboxPileSegment } from '../categorize-inbox-pile-segment/categorize-inbox-pile-segment';

export const CategorizeInboxPileBar = () => {
    const { items, remainingCount, categorizedCount } = useCategorizeInboxContext();

    const totalCount = remainingCount + categorizedCount;
    const { segments } = getCategorizeInboxPile(items, totalCount);
    const sortedShare = isPositiveNumber(totalCount) ? categorizedCount / totalCount : 0;

    return (
        <View className="h-[8px] flex-row gap-x-xxs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {segments
                .filter(({ count }) => isPositiveNumber(count))
                .map(segment => (
                    <CategorizeInboxPileSegment key={segment.section} className={segment.className} share={segment.share} />
                ))}
            {isPositiveNumber(categorizedCount) ? (
                <CategorizeInboxPileSegment className={CATEGORIZE_INBOX_SORTED_CLASS_NAME} share={sortedShare} />
            ) : null}
        </View>
    );
};
