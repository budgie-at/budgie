import { View } from 'react-native';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxPile } from '../../utils/get-categorize-inbox-pile.util';
import { CategorizeInboxPileSegment } from '../categorize-inbox-pile-segment/categorize-inbox-pile-segment';

export const CategorizeInboxPileBar = () => {
    const { items, remainingCount, categorizedCount } = useCategorizeInboxContext();

    const { segments } = getCategorizeInboxPile(items, remainingCount + categorizedCount);

    return (
        <View
            className="h-[6px] overflow-hidden rounded-full bg-secondary-corner"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {segments.map(segment => (
                <CategorizeInboxPileSegment
                    key={segment.className}
                    className={segment.className}
                    offset={segment.offset}
                    share={segment.share}
                />
            ))}
        </View>
    );
};
